# Family Memoirs

一个移动端优先的家庭回忆录网页。打开网址时先看到成品预览，点击角落里的“编辑”入口后可以添加封面、年份、照片和视频。

## 部署

项目已经接入 Netlify Blobs，用于跨设备同步照片、视频和回忆录数据。

推荐把整个源码仓库连接到 Netlify，让 Netlify 按照 `netlify.toml` 构建：

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

不要只上传 `dist` 静态文件夹，否则 Netlify Functions 和 Blobs 不会生效。

## 本地命令

```bash
npm install
npm run dev
npm run build
```
