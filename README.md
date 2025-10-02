# MLA 9 引文生成器（Node 全栈）

一个可本地运行的完整项目：后端提供 MLA 9 引文生成 API，前端提供现代化交互页面，支持本地即时生成与调用后端进行程序化使用或服务端校验。

## 功能特性
- 来源类型支持：
  - 书籍（Book）
  - 网页（Website/Page）：支持访问日期与（可选）发布日期/发布者
  - 期刊文章（Journal Article）：支持卷、期、页码与 DOI/URL
- 作者格式：
  - 1 位作者：`姓, 名`
  - 2 位作者：`姓, 名, and 名 姓`
  - 3 位及以上：`姓, 名, et al.`
- 日期格式：MLA 风格的日-月-年（如 `23 Jan. 2024`）；缺失日期显示为 `n.d.`
- 容器斜体：书名、期刊名（HTML 输出中斜体显示）
- 实时预览、复制到剪贴板、下载为文本/HTML
- 可选调用后端 API 进行校验与生成（便于程序化调用）

## 目录结构
```
mla-generator-node/
├─ public/            # 前端静态资源（可直接打开 index.html 预览）
│  ├─ index.html
│  ├─ styles.css
│  └─ script.js
├─ src/
│  └─ citation.js     # 后端 MLA 生成核心逻辑
├─ server.js          # Express 后端，静态资源与 API
├─ package.json
├─ .gitignore
└─ README.md
```

## 本地运行
1. 安装依赖
```
npm install
```
2. 启动后端（同时提供前端页面）
```
npm start
```
3. 打开浏览器访问
```
http://localhost:3000
```
- 页面默认本地即时生成；勾选“使用后端 API 生成”可调用后端进行验证与生成。

开发模式（热重载）
```
npm run dev
```

## 后端 API
- `POST /api/generate`
  - 请求体（示例：期刊）
  ```json
  {
    "type": "journal",
    "data": {
      "authors": ["Doe, Jane", "John Smith"],
      "articleTitle": "Quantum Entanglement Basics",
      "journalName": "Nature Physics",
      "volume": "12",
      "issue": "3",
      "year": "2021",
      "pages": "123-145",
      "doiOrUrl": "10.5678/xyz"
    }
  }
  ```
  - 响应体
  ```json
  {
    "ok": true,
    "type": "journal",
    "data": { ... },
    "citationText": "...",
    "citationHTML": "..."
  }
  ```
  - 校验失败返回 400，包含 `errors` 数组。

支持的 `type` 与字段
- book
  - 必填：`title`, `publisher`, `year`
  - 可选：`authors[]`, `edition`, `doiOrUrl`
- website
  - 必填：`pageTitle`, `websiteName`, `url`, `accessDate`
  - 可选：`authors[]`, `publisher`, `publishDate`
- journal
  - 必填：`articleTitle`, `journalName`, `year`
  - 可选：`authors[]`, `volume`, `issue`, `pages`, `doiOrUrl`

## 使用说明与约定
- 作者输入支持两种格式：`姓, 名` 或 `名 姓`；程序将自动转换为 MLA 显示规则。
- DOI/URL：如果填写 DOI（以 `10.` 开头或 `doi:` 开头），输出将规范化为 `https://doi.org/xxx`；否则按 URL 原样输出。
- 页码：单页用 `p. N`，范围用 `pp. N-M`。
- 这是一个可扩展的 PoC 项目，暂未引入数据库；如需持久化或更复杂规则，可在 `src/citation.js` 中扩展或新增来源类型。

## 测试路由
- 用途：用于联通性与多路由测试。
- 路径：`GET /hello`
- 响应：纯文本 `hello`
- 示例：
  - 浏览器访问：`http://localhost:3000/hello`
  - 命令行：`curl -i http://localhost:3000/hello`

## 常见问题
- 前端“使用后端 API 生成”勾选失败：可能后端未运行或端口占用；请确认 `npm start` 已启动并访问 `http://localhost:3000/api/health` 返回 `{ ok: true }`。
- 仅预览静态页面：你可以直接打开 `public/index.html`（纯静态不依赖后端），但“后端可用”状态将显示不可用。

## 许可证
MIT


## Frontend Usage (English)
- Static Preview: Visit the deployed page to try local, instant generation without a backend.
  - URL: https://de719e270afa.aime-app.bytedance.net
- Local Run with Backend:
  1) Install dependencies: `npm install`
  2) Start the server: `npm start`
  3) Open http://localhost:3000
  - By default, the page generates citations locally. Check “Generate via backend API” to call `/api/generate` for server-side validation and generation.
- Supported Source Types: Book, Website/Page, Journal Article.
- Key Fields & MLA Terms: Authors, Title, Website Name, Publication Date, Access Date, Journal Name, Volume, Issue, Pages, DOI/URL.
- Tips:
  - Websites: include an Access Date.
  - Journals: include volume, issue, pages, and DOI/URL.
  - Book and journal titles are italicized in HTML output.