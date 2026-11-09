# 小岛主页

一个可以逛的个人主页模板。首页是一座小岛,点击岛上的建筑进入「关于我 / 作品 / 博客 / 联系」,支持昼夜切换和月亮升起动画。纯静态,无需构建,无依赖。

## 快速开始

```bash
# 任意静态服务器都行
python3 -m http.server 8000
# 打开 http://localhost:8000
```

需要通过本地服务器访问;直接双击打开 `index.html` 时,浏览器会拦截资源,首页动画会退化为静态图。

也可以直接部署到 Cloudflare Pages、Vercel、GitHub Pages,发布目录选项目根目录。

## 修改内容

所有文字都在 `content.js`:

| 字段 | 说明 |
|---|---|
| `siteTitle` | 页面标题 |
| `about` | 头像、名字、身份、喜好、6 枚徽章文字 |
| `works` | 作品,每页 3 幅,超过自动分页 |
| `blog` | 博客,最多显示 6 篇 |
| `contact` | 手机上 5 个图标对应的联系方式 |

头像填图片路径即可,例如 `avatar: 'img/me.jpg'`。作品封面放进 `img/`,尺寸约 236×182。

页面标题、徽章图标、手机 App 图标是画在背景图里的,只改 `content.js` 不会变化,需要替换对应的图片。

## 背景音乐

把音频文件放到 `audio/bgm.mp3`(循环播放,建议 2–4 MB 以内、版权可用)。导航栏会出现音乐按钮,点击播放/暂停,状态会被记住。没有这个文件时按钮自动隐藏。

## 目录

```
index.html      页面骨架与顶部导航
style.css       样式
app.js          视图、路由、动画、昼夜切换
content.js      站点内容
img/            背景图与封面
audio/bgm.mp3   背景音乐(自备)
img/island/     首页小岛的图层与场景数据
tools/island/   生成首页图层的脚本(可选,正常使用不需要;需要自备 concepts/ 与 sprites/ 中间素材、本机 Chrome,`npm i` 后运行,可用 CHROME_PATH 指定浏览器)
```

## 背景图

所有背景图原始尺寸为 1672×941,交互热区坐标以此为基准,写在 `app.js` 的 `build` 里。替换背景图时保持这个尺寸,否则热区会错位。

## 浏览器

最新版 Chrome、Safari、Firefox、Edge。首页水面和植物使用 WebGL,不支持时会自动降级为静态图。
系统开启「减少动态效果」时,转场和月亮动画会关闭。

## 许可

- 代码(`index.html`、`style.css`、`app.js`、`content.js`、`tools/`):[MIT](../LICENSE)。
- 图片(`img/`)与音频(`audio/`):保留所有权利,仅供预览与学习。用于自己的网站前,请替换为你有权使用的素材。
- 字体 Zen Maru Gothic 通过 Google Fonts 加载,遵循 SIL OFL 1.1。
