# 家庭回忆录 Netlify 部署说明

这个版本已经接入 Netlify Blobs。照片、视频和回忆录数据会保存在 Netlify 云端，同一个网址在不同设备打开后会读取同一份内容。

## 推荐部署方式

1. 把整个项目上传到 GitHub。
2. 在 Netlify 新建站点，选择这个 GitHub 仓库。
3. Netlify 会自动读取 `netlify.toml`：
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
4. 部署成功后，打开公开网址，点击右上角很淡的“编辑”入口添加内容。

## 重要提醒

- 不要只拖 `dist` 文件夹到 Netlify Drop。那样只有静态网页，没有 Netlify Functions，也就不能跨设备同步。
- 如果用 Netlify CLI，也要从项目根目录部署，让 Netlify 一起处理 `netlify/functions`。
- 图片会自动压缩后上传。很大的视频可能超过 Netlify Functions 单次上传限制，建议先压缩视频再添加。
