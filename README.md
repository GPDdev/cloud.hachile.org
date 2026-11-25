# 云中城 Cloudsdale

<div align="center"><img alt="HTML, CSS and JavaScript" src="https://img.shields.io/badge/site-static-506d89"><img alt="Code license: MIT" src="https://img.shields.io/badge/code-MIT-709b8f"></div>

天蓝晨风（Skyblue Mornbreeze）是一只住在云中城的蓝色小天马。走进小屋，透过拱窗看云海，点天蓝认识屋主，点画架翻看角色画，点书桌旁的信箱去主页留言。窗外的天色和屋内的灯光随昼夜开关变化。

[中文主页](https://cloud.hachile.org/) / [English](https://cloud.hachile.org/en/)

## 本地预览

用静态文件服务器打开仓库根目录。

```sh
python -m http.server 8000
```

访问 `http://localhost:8000/` 或 `http://localhost:8000/en/`。拖动鼠标或在手机上左右滑动可以转动镜头。键盘用户可将焦点移入小屋，用方向键环顾；工具栏可以拉近、拉远及恢复初始视角。画册支持左右方向键，弹窗支持 Esc。

手记模式可直接阅读。浏览器会记住浏览模式和昼夜选择。若设备无法使用 WebGL，页面会显示小屋静态图，并保留角色、画册和信箱入口。

## 维护与发布

| 文件 | 用途 |
| --- | --- |
| `tools/build.mjs` | 双语文案、外部链接和页面模板 |
| `index.html`、`en/index.html` | 可直接发布的中文和英文页面 |
| `style.css`、`cloud.js` | 页面样式、场景与手记切换、画册及弹窗 |
| `room/engine.js` | 透视镜头控制、物体点选和物件标签定位 |
| `room/model.js` | 小屋建筑、家具、角色和照明 |
| `room/vendor/` | 随站点分发的 Three.js 及许可证 |
| `assets/` | 云中城窗景、角色画、小屋静态图和可爱标记 |

修改模板后运行以下命令，并将生成的两个 HTML 一起提交。GitHub Pages 从 `main` 的根目录发布，`CNAME` 记录正式域名。

```sh
node tools/build.mjs
node --check cloud.js
```

## 素材与许可

角色设定、立绘和可爱标记来自站主的 [Pony 主页](https://pony.hachile.org/)，社群身份及兴趣也可参见 [Sky](https://sky.hachile.org/) 与 [Home](https://home.hachile.org/)。窗外的云海全景为本站生成，室内建筑与家具在代码中建模。小屋探索与图文双模式参考了 [Lumaoxuxu](https://cn.lumaoxuxu.com/en/)。

3D 渲染使用随站点一同提供的 [Three.js r160](https://github.com/mrdoob/three.js/tree/r160)，原作者的 MIT 授权见 [Three.js 许可证](room/vendor/LICENSE-three.txt)。

原创网页代码采用 [MIT 许可证](LICENSE)。插画、角色和标记的权利归各自权利人，代码许可证不为这些素材授予再分发许可。
