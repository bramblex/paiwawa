# 拍哇哇

<!-- impeccable:product-schema 1 -->

## Platform

Web browser, desktop-first with a responsive touch fallback.

## Stack

Vite + TypeScript + Three.js. This is inferred from the user's request for a lightweight Web 3D game and the existing GLB/PNG asset set.

## Users

Players who enjoy short observational puzzles, visual jokes, and finding a precise camera angle.

## Product Purpose

Create a compact playable photography puzzle in which the player walks through a small street scene and composes two unrelated signs into one intentional visual gag.

## Positioning

The puzzle is solved through perspective, not through inventory, dialogue, or a visible alignment overlay. The street itself is the interface; the camera frame is the puzzle board.

## Operating Context

- A single browser session lasting a few minutes.
- Desktop controls use keyboard movement, mouse look, and a dedicated shutter action.
- Touch controls remain available on narrow screens.
- The first scene is a self-contained vertical slice rather than a level editor or production content pipeline.
- Music starts only after the player explicitly begins the game, with a persistent in-session mute control.

## Capabilities and Constraints

- Use the approved public-toilet direction-sign PNG without stretching it.
- Use the approved square WAWA bamboo-cicada lightbox asset, preserving the exact `WAWA` spelling.
- Use the locally imported CC0 Kenney road and building GLB assets.
- Judge the photo in screen space: both signs must be visible, WAWA must sit below the toilet sign, and the toilet arrow must point toward the WAWA sign.
- Do not show a persistent alignment reticle or live solution meter. Feedback appears only after the shutter is pressed.
- Keep the scene small enough to load quickly in a modern browser.
- A distant public-toilet building may enrich the street story, but it is not a photography target and must not obstruct the road or sidewalk.
- BGM and feedback sounds are bundled locally from verified CC0 sources.

## Brand Commitments

- The visual joke comes from the authored signs and the player's framing; UI decoration must not compete with it.
- The world is stylized, clean, slightly cinematic, and legible rather than photorealistic.
- UI language is concise Simplified Chinese.
- Controls and feedback use neutral, high-contrast shapes and custom SVG icons rather than emoji.

## Evidence on Hand

- `public/assets/signs/public-toilet-450m-front-texture.png`
- `public/assets/signs/wawa-bamboo-cicada-lightbox-front.png`
- `public/assets/models/roads/`
- `public/assets/models/buildings/`
- User sketch supplied on 2026-08-26: toilet sign on the left, road in the middle, building on the right.

## Product Principles

1. Let the player discover the alignment instead of drawing it for them.
2. Make every failed photo explain one actionable framing problem.
3. Keep the authored signs readable and proportionally correct at all times.
4. Prioritize a polished, complete one-scene loop over broad unfinished systems.
5. Verify the actual browser experience, not only the build output.
