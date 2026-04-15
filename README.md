# 电影感婚礼邀请函（EdgeOne Pages）

## 当前内容

- 新郎新娘：房乃玉 / 郑一斐
- 婚礼日期：2026-05-24
- 地址：青岛黄岛区石灿酒店（黄岛区团结路2528号）
- 背景音乐：`./结婚.mp3`
- 背景图：`scene_04_03.png`（页面使用优化版 `assets/optimized/scene_04_03.webp`）
- 留言方式：姓名 + 留言，提交后直接转发到邮箱（不公开展示）

## 目录说明

- `index.html`：页面结构
- `style.css`：电影化视觉样式
- `script.js`：轮播、倒计时、音乐、留言提交逻辑
- `edge-functions/api/messages.js`：留言转发接口（POST）
- `assets/optimized/*.webp`：Web 优化图片

## 本地预览

```bash
cd /mnt/naiyufang/vg/acp/hunli
python3 -m http.server 8080
```

打开 `http://localhost:8080`。

说明：本地静态服务下，`/api/messages` 不可用；留言提交需在 EdgeOne 部署环境测试。

## 部署到 EdgeOne Pages

1. 将目录推送到 GitHub 仓库。
2. 在 EdgeOne Pages 导入仓库，部署项目。
3. 确保项目启用 Edge Functions（仓库中包含 `edge-functions` 目录）。
4. 在 EdgeOne 环境变量中添加：
   - `RESEND_API_KEY`（必填）
   - `MAIL_FROM`（建议必填，Resend 已验证发件地址）
   - `MAIL_TO`（可选，默认 `nerdfny@163.com`）
5. 重新部署后，通过页面提交留言进行验证。

## 留言接口

- `POST /api/messages`

```json
{
  "guestName": "可选",
  "impression": "2-120字"
}
```

成功返回 `201`，失败返回 `4xx/5xx` 和错误信息。
