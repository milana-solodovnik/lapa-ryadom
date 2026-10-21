"""Read recent Chrome/Edge downloads and report WHY each one stopped.

Chrome records downloads,downloads_url_chains and an explicit
`interrupt_reason` per download, which tells us whether a truncated file was a
network error, a cancelled download, a disk write failure or a duplicate.

The browser may be running, so History is copied before reading.
"""
import os
import shutil
import sqlite3
import sys
import tempfile
from datetime import datetime, timedelta, timezone

sys.stdout = open(
    os.devnull, "w"
) and __import__("io").TextIOWrapper(
    sys.stdout.buffer, encoding="utf-8", errors="replace"
)

PROFILES = [
    (r"%LOCALAPPDATA%\Google\Chrome\User Data\Default", "Chrome"),
    (r"%LOCALAPPDATA%\Microsoft\Edge\User Data\Default", "Edge"),
]

# chrome::download::InterruptReason enum values that we care about
INTERRUPT = {
    0: "NONE (completed)",
    1: "FILE_FAILED",
    2: "FILE_ACCESS_DENIED",
    3: "FILE_NO_SPACE",
    4: "FILE_NAME_TOO_LONG",
    5: "FILE_TOO_LARGE",
    6: "FILE_VIRUS_INFECTED",
    7: "FILE_TRANSIENT_ERROR",
    8: "FILE_BLOCKED_BY_CLIENT",
    9: "FILE_SECURITY_CHECK_FAILED",
    10: "FILE_TOO_SHORT",
    11: "FILE_HASH_MISMATCH",
    12: "FILE_TOO_BIG",
    13: "FILE_NAME_INVALID",
    14: "FILE_FILENAME_TOO_LONG",
    20: "NETWORK_FAILED",
    21: "NETWORK_TIMEOUT",
    22: "NETWORK_DISCONNECTED",
    23: "NETWORK_SERVER_DOWN",
    24: "NETWORK_REQUEST_FAILED",
    25: "NETWORK_FORBIDDEN",
    26: "NETWORK_UNREACHABLE",
    27: "NETWORK_USER_CANCELLED",
    28: "NETWORK_TOO_MANY_REQUESTS",
    29: "NETWORK_URL_INVALID",
    31: "SERVER_BAD_CONTENT",
    32: "SERVER_FAILED",
    33: "SERVER_NO_RANGE",
    34: "SERVER_BAD_CODE",
    35: "SERVER_UNAUTHORIZED",
    40: "USER_SHUTDOWN",
    41: "USER_CANCELED",
    42: "USER_PAUSED",
    43: "USER_SUSPENDED",
    1000: "LAST",
}


def ts(v):
    if not v:
        return "(not finished)"
    return (datetime(1601, 1, 1, tzinfo=timezone.utc) + timedelta(microseconds=v)).strftime(
        "%Y-%m-%d %H:%M:%S"
    )


def mb(n):
    return f"{(n or 0) / 1048576:.1f} MB"


def main():
    for tmpl, name in PROFILES:
        hist = os.path.join(os.path.expandvars(tmpl), "History")
        if not os.path.exists(hist):
            continue
        tmp = os.path.join(tempfile.gettempdir(), f"dh_{name.lower()}.db")
        shutil.copy2(hist, tmp)
        con = sqlite3.connect(tmp)
        cur = con.cursor()

        rows = cur.execute(
            """
            SELECT id, target_path, received_bytes, total_bytes, state,
                   start_time, end_time, interrupt_reason, mime_type, referrer
            FROM downloads
            ORDER BY start_time DESC
            LIMIT 10
            """
        ).fetchall()

        if not rows:
            con.close()
            continue

        print(f"===== {name}: last 10 downloads =====")
        for (
            did,
            target,
            recv,
            total,
            state,
            start,
            end,
            reason,
            mime,
            referrer,
        ) in rows:
            chain = cur.execute(
                "SELECT url FROM downloads_url_chains WHERE id = ? ORDER BY chain_index",
                (did,),
            ).fetchall()
            pct = f" ({recv * 100 // total}%)" if total else ""
            print(f"  [{state}] {mb(recv)} / {mb(total)}{pct}")
            print(f"    started        : {ts(start)}")
            print(f"    ended          : {ts(end)}")
            print(f"    interrupt      : {reason} = {INTERRUPT.get(reason, 'UNKNOWN')}")
            print(f"    mime           : {mime}")
            print(f"    referrer       : {referrer}")
            print(f"    target         : {target}")
            for (u,) in chain:
                print(f"    url            : {u}")
            print()
        con.close()


if __name__ == "__main__":
    main()