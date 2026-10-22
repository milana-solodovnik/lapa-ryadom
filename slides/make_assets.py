#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Генерирует фоновые картинки презентации в стилистике референсных слайдов.

pptxgenjs не умеет градиентные заливки фигур, поэтому мягкие переливы и
фиолетово-маджентовые панели рисуются здесь и вставляются как картинки.

Палитра снята пипеткой с andrew/*.jpg:
    #3A1A99 -> #621A97 -> #8A1892 -> #A9168B -> #C81477  градиент панели
    #9C259B                                             акцентный маджента
    #A39DC3                                             номер страницы

Запуск:  python slides/make_assets.py
Результат: slides/assets/*.png
"""

import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "assets")

W, H = 1400, 788

# Градиент панели: слева направо, глубокий сине-фиолетовый -> маджента.
GRAD = ["#3A1A99", "#621A97", "#8A1892", "#A9168B", "#C81477"]

ACCENT = "#9C259B"


def rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float64)


def canvas(fill):
    img = np.zeros((H, W, 3), dtype=np.float64)
    img[:, :] = rgb(fill)
    return img


def glow(img, cx, cy, sigma, color, strength=1.0):
    """Мягкое радиальное свечение. cx/cy в долях ширины/высоты."""
    yy, xx = np.mgrid[0:H, 0:W]
    dx = (xx / W - cx)
    dy = (yy / H - cy)
    d2 = dx * dx + dy * dy
    a = np.exp(-d2 / (2.0 * sigma * sigma)) * strength
    col = rgb(color)
    return img * (1.0 - a[:, :, None]) + col * a[:, :, None]


def blend(stops, t):
    """t — двумерный массив 0..1, stops — список цветов. Возвращает RGB."""
    ramp = np.stack([rgb(c) for c in stops], axis=0)
    n = len(stops) - 1
    pos = np.clip(t, 0.0, 1.0) * n
    idx = np.clip(np.floor(pos).astype(int), 0, n - 1)
    frac = (pos - idx)[:, :, None]
    return ramp[idx] * (1 - frac) + ramp[idx + 1] * frac


def linear_gradient(colors, vertical=False, angle_deg=0.0):
    """Линейный градиент по заданным стоп-цветам."""
    yy, xx = np.mgrid[0:H, 0:W]
    if vertical:
        t = yy / (H - 1.0)
    else:
        rad = np.deg2rad(angle_deg)
        t = (xx / (W - 1.0)) * np.cos(rad) + (yy / (H - 1.0)) * np.sin(rad)
        t = (t - t.min()) / (t.max() - t.min())
    return blend(colors, t)


def rounded_mask(w, h, radius):
    """Мягкая маска со скруглёнными углами для прозрачного PNG."""
    ss = 4  # суперсэмплинг, чтобы край не был лестничным
    m = Image.new("L", (w * ss, h * ss), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(m).rounded_rectangle(
        [0, 0, w * ss - 1, h * ss - 1], radius=radius * ss, fill=255
    )
    return m.resize((w, h), Image.LANCZOS)


def save(img, name):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(path, optimize=True)
    print("wrote", os.path.relpath(path, HERE))


def build_light_bg():
    """Светлый фон: почти белый с сиреневым свечением в правом верхнем углу
    и холодным перваншем в левом нижнем -- как на референсных слайдах."""
    img = canvas("#F7F6FA")
    img = glow(img, 1.02, -0.06, 0.42, "#D6C2EE", 0.80)
    img = glow(img, 0.98, 0.48, 0.28, "#E8D6EA", 0.38)
    img = glow(img, -0.04, 1.04, 0.34, "#B9C5EE", 0.70)
    img = glow(img, 0.50, -0.10, 0.24, "#F0EBF7", 0.55)
    save(img, "bg-light.png")


def build_dark_bg():
    """Полноэкранная фиолетово-маджентовая панель для финального слайда."""
    img = linear_gradient(GRAD, angle_deg=18.0)
    yy, xx = np.mgrid[0:H, 0:W]
    # Лёгкое высветление сверху слева, чтобы панель не читалась плоской заливкой.
    a = np.exp(-(((xx / W - 0.18) ** 2 + (yy / H - 0.05) ** 2)) / (2 * 0.45 ** 2)) * 0.22
    img = img * (1 - a[:, :, None]) + rgb("#6C3BC0") * a[:, :, None]
    save(img, "bg-dark.png")


def build_side_panel():
    """Панель для правой половины титульного слайда. Пропорции совпадают с
    местом вставки (6.733 x 5.625 дюйма), чтобы градиент не тянулся."""
    w, h = 1200, 1000
    yy, xx = np.mgrid[0:h, 0:w]
    t = np.clip((xx / (w - 1.0)) * 0.55 + (yy / (h - 1.0)) * 0.45, 0, 1)
    grad = blend(GRAD, t)
    a = np.exp(-(((xx / w - 0.1) ** 2 + (yy / h - 0.05) ** 2)) / (2 * 0.5 ** 2)) * 0.20
    grad = grad * (1 - a[:, :, None]) + rgb("#6C3BC0") * a[:, :, None]
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, "panel-purple.png")
    Image.fromarray(np.clip(grad, 0, 255).astype(np.uint8), "RGB").save(path, optimize=True)
    print("wrote", os.path.relpath(path, HERE))


def build_grad_strip():
    """Скруглённая градиентная полоса 9:1 -- фирменная подложка для выводов,
    счётчиков и итоговых строк. Растягивается без заметных искажений."""
    w, h = 1800, 200
    xx, _ = np.mgrid[0:1, 0:w]
    t = np.clip(xx / (w - 1.0) * 0.92 + 0.04, 0, 1)
    row = blend(GRAD, t)[0]
    img = np.repeat(row[None, :, :], h, axis=0)
    rgba = np.dstack([np.clip(img, 0, 255), np.full((h, w), 255.0)])
    out = Image.fromarray(rgba.astype(np.uint8), "RGBA")
    out.putalpha(rounded_mask(w, h, 30))
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, "grad-strip.png")
    out.save(path, optimize=True)
    print("wrote", os.path.relpath(path, HERE))


if __name__ == "__main__":
    build_light_bg()
    build_dark_bg()
    build_side_panel()
    build_grad_strip()