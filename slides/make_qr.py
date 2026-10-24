#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Генерирует QR-код на адрес репозитория.

Сделано без внешних библиотек: алгоритм взят из спецификации ISO/IEC 18004
(байтовый режим, уровень коррекции M, версия 4 — 33x33 модуля). Для 49 байт
адреса версии 4 хватает с запасом, версии 3 не хватает (42 байта).

Результат проверялся сравнением матрицы с независимым генератором qrserver.com:
матрицы совпали модуль в модуль.

Запуск:  python slides/make_qr.py
Результат: slides/assets/qr-repo.png
"""

import os

from PIL import Image

REPO_URL = "https://github.com/milana-solodovnik/lapa-ryadom"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "qr-repo.png")

VERSION = 4
ECC_CODEWORDS_PER_BLOCK = 18
NUM_BLOCKS = 2
DATA_CODEWORDS_PER_BLOCK = 32

# Уровни коррекции: (биты в формате, порядок блоков, число блоков группы1/2).
# Нужен только M: две группы по одному блоку, по 32 кодовых слова данных.
ECC_FORMAT_BITS = 0b00  # M
ECC_ORDER = 1           # M -> порядок блоков 1

# Позиции центров выравнивающих паттернов по версиям (нужна версия 4).
ALIGNMENT_POSITIONS = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
}

# Порядок следования блоков для версии 4-M: 2 блока одинакового размера,
# поэтому порядок не влияет на результат (блоки одинаковые).


# --- Арифметика GF(256) с примитивным многочленом 0x11D -------------------

def gf_tables():
    exp = [0] * 512
    log = [0] * 256
    x = 1
    for i in range(255):
        exp[i] = x
        log[x] = i
        x <<= 1
        if x & 0x100:
            x ^= 0x11D
    for i in range(255, 512):
        exp[i] = exp[i - 255]
    return exp, log


EXP, LOG = gf_tables()


def gf_mul(a, b):
    if a == 0 or b == 0:
        return 0
    return EXP[LOG[a] + LOG[b]]


def rs_generator(n):
    """Многочлен-генератор кода Рида — Соломона на n кодовых слов."""
    g = [1]
    for i in range(n):
        ng = [0] * (len(g) + 1)
        for j, c in enumerate(g):
            ng[j] ^= c
            ng[j + 1] ^= gf_mul(c, EXP[i])
        g = ng
    return g


def rs_encode(data, n_ecc):
    g = rs_generator(n_ecc)
    res = list(data) + [0] * n_ecc
    for i in range(len(data)):
        c = res[i]
        if c:
            for j in range(1, len(g)):
                res[i + j] ^= gf_mul(g[j], c)
    return res[len(data):]


# --- Подготовка битового потока ------------------------------------------

def build_data_codewords(payload):
    bits = []

    def put(value, length):
        for i in range(length - 1, -1, -1):
            bits.append((value >> i) & 1)

    put(0b0100, 4)                     # байтовый режим
    put(len(payload), 8)               # длина: 8 бит для версий 1-9
    for byte in payload:
        put(byte, 8)

    capacity_bits = DATA_CODEWORDS_PER_BLOCK * NUM_BLOCKS * 8
    put(0, min(4, capacity_bits - len(bits)))   # терминатор
    while len(bits) % 8:
        bits.append(0)

    codewords = []
    for i in range(0, len(bits), 8):
        v = 0
        for b in bits[i:i + 8]:
            v = (v << 1) | b
        codewords.append(v)

    pad = [0xEC, 0x11]
    i = 0
    while len(codewords) < DATA_CODEWORDS_PER_BLOCK * NUM_BLOCKS:
        codewords.append(pad[i % 2])
        i += 1
    return codewords


def interleave(data_codewords):
    """Перемешивание блоков: сначала данные, потом коды коррекции."""
    blocks = []
    size = DATA_CODEWORDS_PER_BLOCK
    for b in range(NUM_BLOCKS):
        chunk = data_codewords[b * size:(b + 1) * size]
        blocks.append((chunk, rs_encode(chunk, ECC_CODEWORDS_PER_BLOCK)))

    result = []
    for i in range(size):
        for chunk, _ in blocks:
            result.append(chunk[i])
    for i in range(ECC_CODEWORDS_PER_BLOCK):
        for _, ecc in blocks:
            result.append(ecc[i])
    return result


# --- Матрица ---------------------------------------------------------------

def new_matrix(size):
    return [[None] * size for _ in range(size)]


def place_finder(matrix, row, col):
    for r in range(-1, 8):
        for c in range(-1, 8):
            rr, cc = row + r, col + c
            if not (0 <= rr < len(matrix) and 0 <= cc < len(matrix)):
                continue
            if (0 <= r <= 6 and (c == 0 or c == 6)) or \
               (0 <= c <= 6 and (r == 0 or r == 6)) or \
               (2 <= r <= 4 and 2 <= c <= 4):
                matrix[rr][cc] = True
            else:
                matrix[rr][cc] = False


def place_alignment(matrix, row, col):
    for r in range(-2, 3):
        for c in range(-2, 3):
            matrix[row + r][col + c] = (max(abs(r), abs(c)) != 1)


def reserve(matrix):
    size = len(matrix)
    place_finder(matrix, 0, 0)
    place_finder(matrix, 0, size - 7)
    place_finder(matrix, size - 7, 0)

    for i in range(8, size - 8):
        if matrix[6][i] is None:
            matrix[6][i] = (i % 2 == 0)
        if matrix[i][6] is None:
            matrix[i][6] = (i % 2 == 0)

    positions = ALIGNMENT_POSITIONS[VERSION]
    for r in positions:
        for c in positions:
            if (r, c) in ((6, 6), (6, size - 7), (size - 7, 6)):
                continue
            place_alignment(matrix, r, c)

    # Места под форматную информацию тоже служебные: если их не занять,
    # разметка данных затечёт в них и весь поток сдвинется. Значение пока
    # произвольное — настоящие биты ставит place_format.
    for i in range(6):
        matrix[i][8] = False
    matrix[7][8] = False
    matrix[8][8] = False
    matrix[8][7] = False
    for i in range(9, 15):
        matrix[8][14 - i] = False
    for i in range(8):
        matrix[8][size - 1 - i] = False
    for i in range(8, 15):
        matrix[size - 15 + i][8] = False

    matrix[size - 8][8] = True          # тёмный модуль


def reserved_mask(matrix):
    size = len(matrix)
    reserved = [[False] * size for _ in range(size)]
    for r in range(size):
        for c in range(size):
            if matrix[r][c] is not None:
                reserved[r][c] = True
    return reserved


def place_data(matrix, reserved, codewords):
    size = len(matrix)
    bits = []
    for cw in codewords:
        for i in range(7, -1, -1):
            bits.append((cw >> i) & 1)

    idx = 0
    col = size - 1
    upward = True
    while col > 0:
        if col == 6:
            col -= 1
        rows = range(size - 1, -1, -1) if upward else range(size)
        for row in rows:
            for c in (col, col - 1):
                if not reserved[row][c]:
                    matrix[row][c] = bool(bits[idx]) if idx < len(bits) else False
                    idx += 1
        upward = not upward
        col -= 2


MASKS = [
    lambda r, c: (r + c) % 2 == 0,
    lambda r, c: r % 2 == 0,
    lambda r, c: c % 3 == 0,
    lambda r, c: (r + c) % 3 == 0,
    lambda r, c: (r // 2 + c // 3) % 2 == 0,
    lambda r, c: (r * c) % 2 + (r * c) % 3 == 0,
    lambda r, c: ((r * c) % 2 + (r * c) % 3) % 2 == 0,
    lambda r, c: ((r + c) % 2 + (r * c) % 3) % 2 == 0,
]


def apply_mask(matrix, reserved, mask):
    out = [row[:] for row in matrix]
    f = MASKS[mask]
    for r in range(len(out)):
        for c in range(len(out)):
            if not reserved[r][c] and f(r, c):
                out[r][c] = not out[r][c]
    return out


def penalty(matrix):
    size = len(matrix)
    score = 0

    # Правило 1: пять подряд одинаковых.
    for line in list(matrix) + [list(col) for col in zip(*matrix)]:
        run = 1
        for i in range(1, size):
            if line[i] == line[i - 1]:
                run += 1
            else:
                if run >= 5:
                    score += 3 + (run - 5)
                run = 1
        if run >= 5:
            score += 3 + (run - 5)

    # Правило 2: квадраты 2x2 одного цвета.
    for r in range(size - 1):
        for c in range(size - 1):
            v = matrix[r][c]
            if v == matrix[r][c + 1] == matrix[r + 1][c] == matrix[r + 1][c + 1]:
                score += 3

    # Правило 3: узоры 1011101 с полями.
    pat1 = [True, False, True, True, True, False, True, False, False, False, False]
    pat2 = list(reversed(pat1))
    for line in list(matrix) + [list(col) for col in zip(*matrix)]:
        for i in range(size - 10):
            window = line[i:i + 11]
            if window == pat1 or window == pat2:
                score += 40

    # Правило 4: доля тёмных модулей.
    dark = sum(1 for row in matrix for v in row if v)
    percent = dark * 100.0 / (size * size)
    score += int(abs(percent - 50) / 5) * 10
    return score


def bch_format(data5):
    value = data5 << 10
    generator = 0b10100110111
    for i in range(4, -1, -1):
        if value & (1 << (i + 10)):
            value ^= generator << i
    return ((data5 << 10) | value) ^ 0b101010000010010


def place_format(matrix, mask):
    size = len(matrix)
    fmt = bch_format((ECC_FORMAT_BITS << 3) | mask)
    # Бит 0 (младший) идёт первым — раскладка как в эталонных реализациях:
    # вверх по столбцу 8, потом вокруг верхнего левого искателя.
    bits = [(fmt >> i) & 1 for i in range(15)]

    for i in range(6):
        matrix[i][8] = bool(bits[i])
    matrix[7][8] = bool(bits[6])
    matrix[8][8] = bool(bits[7])
    matrix[8][7] = bool(bits[8])
    for i in range(9, 15):
        matrix[8][14 - i] = bool(bits[i])

    for i in range(8):
        matrix[8][size - 1 - i] = bool(bits[i])
    for i in range(8, 15):
        matrix[size - 15 + i][8] = bool(bits[i])
    matrix[size - 8][8] = True


def encode(payload):
    size = 17 + 4 * VERSION
    matrix = new_matrix(size)
    reserve(matrix)
    reserved = reserved_mask(matrix)
    codewords = interleave(build_data_codewords(payload))
    place_data(matrix, reserved, codewords)

    best = None
    for mask in range(8):
        candidate = apply_mask(matrix, reserved, mask)
        place_format(candidate, mask)
        score = penalty(candidate)
        if best is None or score < best[0]:
            best = (score, mask, candidate)
    return best[2], best[1]


def to_png(matrix, path, scale=12, quiet=4):
    size = len(matrix)
    side = (size + quiet * 2) * scale
    img = Image.new("L", (side, side), 255)
    px = img.load()
    for r in range(size):
        for c in range(size):
            if matrix[r][c]:
                for dy in range(scale):
                    for dx in range(scale):
                        y = (r + quiet) * scale + dy
                        x = (c + quiet) * scale + dx
                        px[x, y] = 0
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, optimize=True)
    return path


if __name__ == "__main__":
    payload = REPO_URL.encode("utf-8")
    matrix, mask = encode(payload)
    print("адрес      :", REPO_URL)
    print("длина      :", len(payload), "байт")
    print("версия     :", VERSION, "->", len(matrix), "x", len(matrix), "модулей")
    print("выбранная маска:", mask)
    path = to_png(matrix, OUT)
    print("записан    :", os.path.relpath(path, os.path.dirname(OUT)))
