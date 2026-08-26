---
name: 拍哇哇
description: 暮色街景中的观察式摄影构图小游戏
colors:
  ink: "#11171c"
  night: "#101820"
  sky-top: "#17243a"
  paper: "#f4efe3"
  warm: "#efb277"
  signal: "#ff684d"
  muted: "rgba(244, 239, 227, 0.66)"
  focus: "#fff4d6"
  success: "#b8e0b1"
typography:
  display:
    fontFamily: "ZCOOL QingKe HuangYou, sans-serif"
    fontSize: "clamp(3.5rem, 8vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "-0.03em"
  body:
    fontFamily: "PingFang SC, Noto Sans CJK SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "clamp(15px, 1.3vw, 19px)"
    fontWeight: 400
    lineHeight: 1.72
  label:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.16em"
rounded:
  control: "0px"
  lock-dot: "50%"
spacing:
  intro: "clamp(28px, 5.5vw, 88px)"
  hud-edge: "max(24px, env(safe-area-inset-left/right))"
components:
  primary-action:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "54px"
    padding: "0 20px 0 24px"
  shutter:
    backgroundColor: "rgba(13, 18, 22, 0.72)"
    textColor: "#ffffff"
    rounded: "50%"
    size: "74px"
---

# Design System: 拍哇哇

## Overview

**Creative North Star: “暮色里的胶片取景册”**

这是一个把 3D 街景当作摄影棋盘的短篇观察谜题。深蓝到橙粉的黄昏天空、路灯暖光和干净的道路模型构成安静而略带电影感的世界；UI 则像一张深色取景器上叠放的纸张工作单，信息克制，让两个 authored 标牌保持主角。

界面使用简短的简体中文、等宽小标签和高对比线框。开场是带分隔线的 editorial 任务卡，拍摄结果是轻微倾斜的 contact sheet；反馈只在按下快门后出现。

**Key Characteristics:**
- 深蓝夜色与暖纸张/琥珀色点缀
- 几何、无圆角的控制面板与线框
- 纸张/胶片式结果卡片
- 中性、不泄露答案的取景框

## Colors

Palette is cinematic and restrained: night surfaces carry the scene, paper and warm amber carry readable UI emphasis, and coral is reserved for shutter/success feedback.

### Primary
- **Warm amber** (#efb277): loading progress, task marker, active touch state and primary visual emphasis.
- **Signal coral** (#ff684d): shutter hover and successful-result accent.

### Neutral
- **Night** (#101820): application and loading background.
- **Sky blue** (#17243a): upper dusk atmosphere and Three.js scene background.
- **Ink** (#11171c): paper text and dark action surfaces.
- **Paper** (#f4efe3): intro/result surfaces and primary action text field.
- **Muted paper** (rgba(244, 239, 227, 0.66)): secondary labels over the scene.

## Typography

**Display Font:** ZCOOL QingKe HuangYou (self-hosted Fontsource/OFL)

**Body Font:** PingFang SC (with Noto Sans CJK SC, Microsoft YaHei, system-ui fallbacks)

**Label/Mono Font:** ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas

**Character:** The self-hosted Chinese display face is playful and legible at a compact poster scale; compact uppercase mono labels provide a photographic index language where metadata remains useful.

### Hierarchy
- **Display** (400, clamp(3.5rem, 8vw, 6rem), 0.9): opening title, with tracking no tighter than -0.03em.
- **Headline** (800–900, clamp(27px, 3vw, 42px)): objective and result title.
- **Body** (400, clamp(15px, 1.3vw, 19px), 1.72): intro explanation and actionable copy.
- **Label** (700, 11px, 0.16em, uppercase): compact loading and control metadata where present.

## Layout

The game is a full-viewport, overflow-hidden composition: the Three.js canvas fills the shell, while loading, intro, HUD and result layers are absolute overlays. Desktop intro uses a 44vw copy rail and a vertical FRAME rule; mobile collapses to a bottom-weighted single column. HUD edge offsets respect safe-area insets.

The desktop viewfinder is centered at `min(70vw, 1040px)` with a 16:9 ratio. On narrow/coarse-pointer screens it becomes a nearly full-width 4:5 vertical frame, leaving room for touch controls and the shutter. The authored movement bounds are x[-7.4, 5.8] and z[-27.5, 14.5].

## Elevation & Depth

Depth is conveyed by the 3D scene's shadows and dusk lighting, plus restrained overlay treatment: a shell inset vignette, text shadows, a dark translucent HUD, and a lifted contact sheet with `0 24px 80px rgba(0, 0, 0, 0.44)`. UI controls otherwise remain flat and border-led.

## Shapes

Controls, buttons, labels and panels are square-cornered by default. The exceptions are the circular lock dot, viewfinder center, and shutter ring. Borders are thin translucent white over the world and dark ink over paper. The result card uses a slight `rotate(-0.35deg)` film-contact-sheet silhouette.

## Components

### Buttons
- **Primary start:** paper fill, ink text, 54px minimum height, square corners, arrow icon; hover shifts warm and translates 4px.
- **Shutter:** transparent button around a 74px circular ring (66px mobile), camera SVG icon, coral hover and scale response; active state compresses.
- **Result actions:** dark ink filled continue action and transparent reset action; hover turns warm.
- **Focus:** all buttons use a visible 3px `#fff4d6` outline with 4px offset.

### Cards / Containers
- **Intro task card:** full-screen translucent night gradient; bottom-aligned copy rail, large display title, lead, task brief and start action.
- **Contact sheet:** paper background, desktop two-column photo/copy layout, 14px photo inset, dark ink typography, responsive single-column mobile layout.

### Navigation

There is no site navigation. The HUD provides an objective with a 1px warm left rule at the safe-area top-left, audio toggle at top-right, centered pointer-lock hint on desktop, and the shutter at the bottom edge.

### Viewfinder

Neutral white corner marks and a 24px circular center crosshair overlay the live canvas. A neutral viewfinder is explicitly allowed; it never reacts to target positions or exposes solution geometry, and composition feedback appears only after shutter capture.

### Touch controls

Coarse-pointer layouts expose a four-button square directional pad and a “拖动画面转向” hint. Buttons use translucent dark fills, 1px light borders and warm active state. Desktop uses WASD/arrow movement, mouse look via pointer lock, Shift sprint and Space shutter.

### Audio control

The audio toggle is a bordered translucent desktop control and an icon-only 42px mobile control. It starts local BGM only after explicit start, pauses when muted or the document is hidden, and swaps speaker waves for a muted mark.

## Do's and Don'ts

- **Do** keep the authored public-toilet arrow and WAWA sign readable, proportionally correct and visually primary.
- **Do** preserve the neutral, solution-blind viewfinder and defer all composition feedback to the result sheet.
- **Do** use concise Simplified Chinese, the self-hosted ZCOOL QingKe HuangYou display face for titles/tasks/results, and custom SVG icons rather than emoji.
- **Do** respect safe-area insets, the desktop/mobile frame ratios, and the authored movement bounds.
- **Do** honor `prefers-reduced-motion` by collapsing transitions and animations.
- **Don't** introduce rounded card/button systems or decorative UI that competes with the street joke.
- **Don't** add target-aware alignment prompts or indicators to the neutral viewfinder.
