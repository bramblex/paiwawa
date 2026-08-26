# 拍哇哇

一个基于 Three.js 的短篇 3D 拍照游戏。玩家在街道上寻找机位，让公共厕所路牌的向下箭头指向大楼楼顶的 WAWA 灯牌。

## 运行

```bash
npm install
npm run dev
```

开发服务器默认运行在 `http://127.0.0.1:4319/`。

## 操作

- `WASD` / 方向键：移动
- 鼠标：点击锁定镜头，或直接拖动画面转向
- `Shift`：加速移动
- `Space`：拍照
- `R`：回到起点
- `M`：打开或关闭声音
- 触屏：左下方向键移动，拖动画面转向，右下快门拍照

移动边界覆盖整段街区，可以走到远处厕所和 WAWA 大楼附近继续寻找机位。HUD 的取景框只帮助构图，不会提示是否已经对准答案。

## 玩法判定

拍照时会在屏幕空间检查：

1. 厕所牌和 WAWA 牌是否都完整、清晰地入镜；
2. WAWA 是否位于厕所牌下方；
3. WAWA 的水平中心是否落在向下箭头尖端下方；
4. 箭头和 WAWA 之间是否保留了清楚但不过大的间距。

失败反馈只在按下快门后出现，取景过程中不会显示实时对齐辅助线。

## 素材

- 道路与建筑：Kenney City Kit，CC0。来源和许可见 `public/assets/models/SOURCES.md` 与 `public/assets/licenses/`。
- 两张灯牌贴图的来源记录位于相邻的 `*.provenance.json` 文件。
- BGM、快门、成功与失败音效：OpenGameArt，CC0。来源见 `public/assets/audio/CREDITS.md`。
- 展示字体：ZCOOL QingKe HuangYou，经 Fontsource 本地打包，OFL-1.1。
