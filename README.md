# Stellar Archive Backend

Stellar Archive 是以「星際探索」為主題的 AI Skill / Prompt 知識庫。這個後端提供公開目錄、搜尋、會員收藏與管理員 CRUD，並以 PostgreSQL 作為唯一資料來源。

> 這是 Andy Lin 的個人作品集版本，源自 2026NodeClass 團隊專案。原始團隊專案與完整成員分工請見[來源與貢獻](#來源與貢獻)。

## 技術重點

| 分類 | 技術 |
| --- | --- |
| Runtime | Node.js 20、Express 5、CommonJS |
| Database | PostgreSQL、pg、TypeORM migration / EntitySchema |
| Security | JWT、bcrypt、USER / ADMIN 權限分層 |
| Delivery | Docker Compose、Zeabur、GitHub Actions |
| Quality | Node.js test runner、API smoke test、參數化 SQL |

## 已完成的老師建議優化

- 將 Express `app` 與 `listen()` 拆開，測試可直接匯入應用程式，不連正式資料庫。
- 補齊 API 自動化測試：目錄資料形狀、搜尋、受控錯誤、未登入收藏、一般會員禁止進入後台、收藏資料隔離。
- Skill / Prompt 新增作者、來源、授權、相容 Agent、版本與更新時間等信任資訊。
- 部署 smoke test 不只檢查 `/health`，還會讀取星系、星球明細與搜尋結果。
- `/api/health` 回傳版本與來源 commit SHA，方便確認線上版本。
- Pull Request 與 `main` push 會自動執行後端測試。

## API 概覽

| Method | Path | 權限 | 用途 |
| --- | --- | --- | --- |
| GET | `/api/health` | 公開 | 健康狀態、版本、來源 SHA |
| POST | `/api/auth/register` | 公開 | 註冊會員 |
| POST | `/api/auth/login` | 公開 | 登入並取得 JWT |
| GET | `/api/galaxies` | 公開 | 取得所有星系 |
| GET | `/api/planets` | 公開 | 取得或依星系篩選星球 |
| GET | `/api/planets/search` | 公開 | 依 keyword / galaxy / type 搜尋 |
| GET | `/api/planets/:id` | 公開 | 取得單一星球 |
| GET / POST / DELETE | `/api/favorites` | JWT | 管理自己的收藏 |
| CRUD | `/api/admin/galaxies` | ADMIN | 維護星系 |
| CRUD | `/api/admin/planets` | ADMIN | 維護星球與信任資訊 |

Planet 回應包含以下可追溯欄位：

```json
{
  "author": "Stellar Archive Team",
  "sourceUrl": "https://example.com/original-skill",
  "license": "MIT",
  "compatibleAgents": ["ChatGPT", "Claude", "Gemini"],
  "version": "1.0.0",
  "updatedAt": "2026-10-03T00:00:00.000Z"
}
```

## 本機啟動

需求：Node.js 20+、Docker Desktop。

```bash
npm ci
cp .env.example .env
npm run dev
npm run sql
```

Windows PowerShell 可用 `Copy-Item .env.example .env` 取代 `cp`。預設 API 位址為 `http://localhost:3010/api`。

## 驗證品質

單元 / 整合測試完全 mock `pool.query`，不會連到正式資料庫：

```bash
npm test
```

部署後 smoke test 會驗證 health、galaxies、planets、單筆 planet 與 search：

```bash
API_URL=https://your-api.example.com/api npm run smoke
```

## Andy Lin 負責內容

Andy 負責公開 Catalog API 與前端資料串接，包含：

- 建立 galaxies、planets、單筆查詢與搜尋端點。
- 以參數化 SQL 處理 keyword / galaxy / type 搜尋。
- 將 Explore、PlanetDetail 從靜態資料改接真實後端。
- 加入 loading、error、AbortController 與 404 狀態。
- 本次個人作品集版本再補上可測試的 app 架構、信任 metadata、權限測試、CI 與部署 smoke test。

可驗證的原始貢獻：

- [Backend commit `f6b6036`](https://github.com/2026NodeClass/backend/commit/f6b6036b486d8358124a9e93deb57af6996b2325)
- [Frontend commit `83372df`](https://github.com/2026NodeClass/frontend/commit/83372df2934e2554d1a825cd31b3d196c3eb1e5d)
- [Backend PR #1](https://github.com/2026NodeClass/backend/pull/1)
- [Frontend PR #2](https://github.com/2026NodeClass/frontend/pull/2)

更完整的 Vibe Coding 流程見 [`docs/ANDY_VIBE_CODING.md`](docs/ANDY_VIBE_CODING.md)。

## 來源與貢獻

本版本保留原始 Git 歷史，不把團隊成果包裝成個人獨作。原始專案：

- [2026NodeClass/backend](https://github.com/2026NodeClass/backend)
- [2026NodeClass/frontend](https://github.com/2026NodeClass/frontend)

| 成員 | 可驗證的主要範圍 |
| --- | --- |
| Andy Lin | 公開 Catalog API、Explore / PlanetDetail 串接、個人作品集強化 |
| SuMaoXiong | PostgreSQL / TypeORM 架構、管理端、環境設定 |
| JeremyC8891 | 註冊登入、JWT、需登入權限處理 |
| YinChe | 3D 銀河與 VoyageMap 前端整合 |

## 後續可延伸

- 為管理端 create / update 補完整 request schema 驗證。
- 建立獨立測試資料庫，增加 migration 與交易層整合測試。
- 加入 rate limiting、集中式 observability 與 secrets rotation。
- 將 smoke test 接到部署完成後的 CD gate。
