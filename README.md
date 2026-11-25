# 云中城 Cloudsdale

<div align="center"><img alt="HTML, CSS and JavaScript" src="https://img.shields.io/badge/site-static-506d89"><img alt="Code license: MIT" src="https://img.shields.io/badge/code-MIT-709b8f"></div>

天蓝晨风（Skyblue Mornbreeze）是一只住在云中城的蓝色小天马。在插画上点选角色可以认识天蓝，点选画册可以翻看四幅角色画，云端信箱通往主页讨论区。也可以切到手记模式阅读，或在场景里点亮夜色。

[中文主页](https://cloud.hachile.org/) / [English](https://cloud.hachile.org/en/)

## 本地预览

用静态文件服务器打开仓库根目录。

```sh
python -m http.server 8000
```

访问 `http://localhost:8000/` 或 `http://localhost:8000/en/`。两种语言共享样式和交互。画册支持左右方向键，弹窗支持 Esc。浏览模式和昼夜选择保存在当前浏览器。

## 维护与发布

| 文件 | 用途 |
| --- | --- |
| `tools/build.mjs` | 双语文案、外部链接和页面模板 |
| `index.html`、`en/index.html` | 可直接发布的中文和英文页面 |
| `style.css`、`cloud.js` | 场景、手记、弹窗和键盘交互 |
| `assets/` | 云中城背景、角色画和可爱标记 |

修改模板后运行以下命令，并将生成的两个 HTML 一起提交。GitHub Pages 从 `main` 的根目录发布，`CNAME` 记录正式域名。

```sh
node tools/build.mjs
node --check cloud.js
```

## 素材与许可

角色设定、立绘和可爱标记来自站主的 [Pony 主页](https://pony.hachile.org/)；社群身份及兴趣也可参见 [Sky](https://sky.hachile.org/) 与 [Home](https://home.hachile.org/)。云海建筑全景为本站生成的场景背景。场景与图文双模式的交互参考了 [Lumaoxuxu](https://cn.lumaoxuxu.com/en/)。

原创网页代码采用 [MIT 许可证](LICENSE)。插画、角色和标记的权利归各自权利人，代码许可证不为这些素材授予再分发许可。
