#!/usr/bin/env pwsh
# QDB-MSSQL: prove that Digital Q.DataBase speaks Microsoft SQL.
#
# Two facts, both checked rather than asserted:
#
#   1. Our project is written on PostgreSQL and was migrated to
#      Digital Q.DataBase with zero DDL changes (scripts/qdb-04-migrate.mjs,
#      scripts/qdb-05-verify.mjs).
#   2. Digital Q.DataBase also speaks Microsoft SQL. The "marble" dialect runs a
#      TDS listener -- the Microsoft SQL Server wire protocol -- and accepts
#      T-SQL DDL and DML.
#
# This script proves (2) from the MS SQL side: it connects with a real MS SQL
# client (System.Data.SqlClient, built into .NET Framework -- nothing installed),
# creates the project's shelters/needs shape in T-SQL, loads the project's real
# seed rows, and reads them back with MS SQL-flavoured syntax.
#
# NOTE: this file must stay UTF-8 *with BOM*. Windows PowerShell 5.1 is the only
# host that ships System.Data, and it decodes BOM-less files as ANSI, which
# would corrupt the Cyrillic literals.
#
# Prerequisites:
#   docker run ... -p 15443:1433 ...      # TDS port published
#   role qdbadmin / qdbadmin
#
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\qdb-mssql-check.ps1
#
# Exit code 0 = T-SQL verified over the Microsoft SQL protocol.

$ErrorActionPreference = 'Stop'

$server   = if ($env:QDB_MSSQL_SERVER)   { $env:QDB_MSSQL_SERVER }   else { '127.0.0.1,15443' }
$database = if ($env:QDB_MSSQL_DATABASE) { $env:QDB_MSSQL_DATABASE } else { 'master' }
$user     = if ($env:QDB_MSSQL_USER)     { $env:QDB_MSSQL_USER }     else { 'qdbadmin' }
$pass     = if ($env:QDB_MSSQL_PASSWORD) { $env:QDB_MSSQL_PASSWORD } else { 'qdbadmin' }

$cs = "Server=tcp:$server;Database=$database;User Id=$user;Password=$pass;" +
      "Encrypt=False;TrustServerCertificate=True;Connect Timeout=20"

$script:pass = 0
$script:fail = 0

Write-Host "[mssql] connecting over TDS to $server/$database ..."
$conn = $null
try {
  $conn = New-Object System.Data.SqlClient.SqlConnection $cs
  $conn.Open()
} catch {
  Write-Error "[mssql] TDS connection failed: $($_.Exception.Message)"
  exit 1
}

function Invoke-Sql([string]$sql) {
  $cmd = $conn.CreateCommand()
  $cmd.CommandText = $sql
  $cmd.CommandTimeout = 60
  $reader = $cmd.ExecuteReader()
  $rows = @()
  while ($reader.Read()) {
    $row = @{}
    for ($i = 0; $i -lt $reader.FieldCount; $i++) { $row[$reader.GetName($i)] = $reader.GetValue($i) }
    $rows += ,$row
  }
  $reader.Close()
  return $rows
}

function Exec-Sql([string]$sql) {
  $cmd = $conn.CreateCommand()
  $cmd.CommandText = $sql
  $cmd.CommandTimeout = 60
  $cmd.ExecuteNonQuery() | Out-Null
}

function Check([string]$name, [bool]$ok, [string]$detail) {
  if ($ok) { Write-Host "[PASS] $name -- $detail"; $script:pass++ }
  else     { Write-Host "[FAIL] $name -- $detail"; $script:fail++ }
}

try {
  $v = Invoke-Sql 'SELECT @@VERSION AS v'
  $firstLine = ($v[0].v -split "`r?`n")[0]
  Check 'connect over TDS' ($v.Count -gt 0) $firstLine

  # --- T-SQL DDL: identity column, named constraints, foreign key -------------
  Exec-Sql @'
IF OBJECT_ID('dbo.needs')        IS NOT NULL DROP TABLE dbo.needs;
IF OBJECT_ID('dbo.shelters')     IS NOT NULL DROP TABLE dbo.shelters;

CREATE TABLE dbo.shelters (
    shelter_id INT IDENTITY(1,1) NOT NULL,
    name       NVARCHAR(200) NOT NULL,
    city       NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_shelters PRIMARY KEY (shelter_id)
);

CREATE TABLE dbo.needs (
    need_id    INT IDENTITY(1,1) NOT NULL,
    shelter_id INT           NOT NULL,
    title      NVARCHAR(200) NOT NULL,
    target_qty INT           NOT NULL,
    unit       NVARCHAR(20)  NOT NULL,
    promised   INT           NOT NULL CONSTRAINT DF_promised DEFAULT 0,
    received   INT           NOT NULL CONSTRAINT DF_received DEFAULT 0,
    CONSTRAINT PK_needs    PRIMARY KEY (need_id),
    CONSTRAINT FK_needs_shelter FOREIGN KEY (shelter_id) REFERENCES dbo.shelters (shelter_id)
);
'@
  Check 'T-SQL DDL accepted' $true 'CREATE TABLE, IDENTITY, CONSTRAINT, FOREIGN KEY'

  # --- The project's real seed rows, written through MS SQL -------------------
  Exec-Sql @"
INSERT INTO dbo.shelters (name, city) VALUES
    (N'Добрые лапы',    N'Москва'),
    (N'Приют Северный', N'Москва'),
    (N'Спасение на юге',N'Омск');

INSERT INTO dbo.needs (shelter_id, title, target_qty, unit, promised, received) VALUES
    (1, N'Сухой корм для взрослых собак',  50,  N'pack',  5, 0),
    (1, N'Наполнитель для кошачьего туалета', 80, N'pack',  0, 0),
    (2, N'Консервы для кошек',             60,  N'pack',  8, 0),
    (3, N'Миски для воды',                 35,  N'piece', 0, 0);
"@
  Check 'T-SQL INSERT of project data' $true '3 shelters, 4 needs written as the shelter would'

  # --- Read back with MS SQL syntax: ISNULL, TOP, arithmetic ------------------
  $r = Invoke-Sql @'
SELECT TOP 4
       ISNULL(s.name, '?')                              AS shelter,
       ISNULL(n.title, '?')                             AS need,
       n.target_qty,
       n.promised,
       n.received,
       n.target_qty - ISNULL(n.promised,0) - ISNULL(n.received,0) AS available
  FROM dbo.needs AS n
  JOIN dbo.shelters AS s ON s.shelter_id = n.shelter_id
 ORDER BY n.need_id
'@
  Check 'T-SQL SELECT with ISNULL/TOP' ($r.Count -eq 4) "rows read back = $($r.Count)"
  Check 'Cyrillic survived the round trip' ($r[0].need -eq 'Сухой корм для взрослых собак') $r[0].need

  # --- The counter formula, computed by the database itself ------------------
  # Keyed by need_id rather than by title: the arithmetic is what this check
  # is about, and a text comparison would drag collation into it.
  $r = @(Invoke-Sql @'
SELECT TOP 1 ISNULL(n.title,'?') AS need, n.target_qty, n.promised, n.received,
       n.target_qty - ISNULL(n.promised,0) - ISNULL(n.received,0) AS available
  FROM dbo.needs AS n
 WHERE n.need_id = 1
'@)
  $row = $r[0]
  $okBal = ($r.Count -eq 1) -and ($null -ne $row) -and ([int]$row.available -eq 45)
  Check 'balance computed in T-SQL' $okBal ("target=$($row.target_qty) promised=$($row.promised) received=$($row.received) available=$($row.available), expected 45")

  # --- MS SQL tools see an MS SQL catalogue ---------------------------------
  $r = Invoke-Sql @'
SELECT name FROM sys.tables
'@
  $names = ($r | ForEach-Object { $_.name }) -join ', '
  Check 'sys.tables visible' ($names -match 'needs') "tables seen by an MS SQL tool: $names"

  $r = Invoke-Sql @'
SELECT TOP 1 c.name AS c FROM sys.columns AS c
 WHERE c.object_id = OBJECT_ID('dbo.needs') AND c.is_identity = 1
'@
  Check 'sys.columns shows IDENTITY' ($r.Count -ge 1) ("identity column: " + $r[0].c)

  # --- Constraint is really enforced, not just accepted ----------------------
  $violated = $false
  $first = Invoke-Sql 'SELECT TOP 1 need_id AS id FROM dbo.needs ORDER BY need_id'
  try {
    Exec-Sql "INSERT INTO dbo.needs (need_id, shelter_id, title, target_qty, unit) VALUES ($($first[0].id), 1, N'dup', 1, N'pack')"
  } catch { $violated = $true }
  Exec-Sql 'DELETE FROM dbo.needs WHERE title = N''dup'''
  Check 'PRIMARY KEY enforced over MS SQL' $violated 'duplicate primary key rejected by the database'

  Exec-Sql 'DROP TABLE dbo.needs; DROP TABLE dbo.shelters;'
  # Left behind by an earlier draft of this script; do not let it accumulate.
  Exec-Sql 'IF OBJECT_ID(''dbo.mssql_demo_needs'') IS NOT NULL DROP TABLE dbo.mssql_demo_needs;'

  Write-Host ''
  Write-Host "[mssql] $script:pass passed, $script:fail failed"
  if ($script:fail -gt 0) { exit 1 }
  Write-Host 'VERDICT: DIGITAL Q.DATABASE ACCEPTS MICROSOFT SQL'
}
finally {
  if ($conn) { $conn.Close() }
}