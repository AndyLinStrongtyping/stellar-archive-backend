-- 建立 LiveFit 所需的資料表。
-- 假資料由 seed_data.js 以參數化查詢寫入，避免把資料重複維護在兩個檔案。

BEGIN;

-- ========================================
-- 使用者資料表
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),      -- 使用者唯一識別碼（UUID）
    name VARCHAR(100) NOT NULL,                          -- 使用者名稱
    email VARCHAR(255) NOT NULL,                          -- 電子信箱
    password_hash VARCHAR(255) NOT NULL,                  -- 密碼雜湊值（不可存明文密碼）
    role VARCHAR(20) NOT NULL DEFAULT 'user',             -- 使用者角色，預設為一般使用者
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 建立時間
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新時間
    CONSTRAINT users_role_check CHECK (role IN ('user','admin'))  -- 限制角色只能是 user 或 admin
);

-- 針對 email 建立不分大小寫的唯一索引，避免重複註冊（例如 A@a.com 與 a@a.com 視為相同）
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_lower_idx
    ON users (LOWER(email));


-- ========================================
-- 銀河（分類）資料表
-- ========================================
CREATE TABLE IF NOT EXISTS galaxies (
    id VARCHAR(50) PRIMARY KEY,        -- 銀河識別碼（自訂字串，如 slug）
    name VARCHAR(100) NOT NULL,        -- 中文名稱
    en VARCHAR(150) NOT NULL,          -- 英文名稱
    color CHAR(7) NOT NULL,            -- 代表色（HEX 色碼，格式如 #RRGGBB）
    description TEXT NOT NULL,         -- 說明文字
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 建立時間
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新時間
    CONSTRAINT galaxies_color_check
        CHECK (color ~ '^#[0-9A-Fa-f]{6}$')   -- 驗證 color 欄位必須符合 HEX 色碼格式
);


-- ========================================
-- 星球（項目 / 內容）資料表
-- ========================================
CREATE TABLE IF NOT EXISTS planets (
    id VARCHAR(50) PRIMARY KEY,         -- 星球識別碼
    galaxy_id VARCHAR(50) NOT NULL,     -- 所屬銀河（外鍵，關聯 galaxies.id）
    type VARCHAR(20) NOT NULL,          -- 類型：prompt 或 skill
    name VARCHAR(150) NOT NULL,         -- 中文名稱
    en VARCHAR(150) NOT NULL,           -- 英文名稱
    coord VARCHAR(30) NOT NULL UNIQUE,  -- 座標（不可重複，作為唯一定位標示）
    difficulty SMALLINT NOT NULL,       -- 難度等級（1~5）
    uses INTEGER NOT NULL DEFAULT 0,    -- 使用次數，預設為 0
    summary TEXT NOT NULL,              -- 摘要說明
    body TEXT NOT NULL,                 -- 內文詳細內容
    author VARCHAR(150) NOT NULL DEFAULT 'Stellar Archive Team', -- 作者 / 維護者
    source_url TEXT,                    -- 原始來源（可為空）
    license VARCHAR(100) NOT NULL DEFAULT '未指定', -- 使用授權
    compatible_agents TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- 相容 AI Agent
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0', -- 內容版本
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 建立時間
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新時間
    CONSTRAINT planets_galaxy_fk
        FOREIGN KEY (galaxy_id)
        REFERENCES galaxies(id)
        ON UPDATE CASCADE     -- 若銀河 id 更新，連帶更新此欄位
        ON DELETE RESTRICT,   -- 若該銀河底下還有星球，禁止刪除該銀河
    CONSTRAINT planets_type_check CHECK (type IN ('prompt', 'skill')),  -- 限制 type 只能是 prompt 或 skill
    CONSTRAINT planets_difficulty_check CHECK (difficulty BETWEEN 1 AND 5),  -- 限制難度範圍為 1~5
    CONSTRAINT planets_uses_check CHECK (uses >= 0)  -- 使用次數不可為負數
);

-- 讓已存在的開發資料庫也能以同一份 schema 補上可信度 metadata。
ALTER TABLE planets ADD COLUMN IF NOT EXISTS author VARCHAR(150) NOT NULL DEFAULT 'Stellar Archive Team';
ALTER TABLE planets ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE planets ADD COLUMN IF NOT EXISTS license VARCHAR(100) NOT NULL DEFAULT '未指定';
ALTER TABLE planets ADD COLUMN IF NOT EXISTS compatible_agents TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE planets ADD COLUMN IF NOT EXISTS version VARCHAR(50) NOT NULL DEFAULT '1.0.0';

-- 針對 galaxy_id 建立索引，加速依銀河查詢星球的效能
CREATE INDEX IF NOT EXISTS planets_galaxy_id_idx
    ON planets (galaxy_id);


-- ========================================
-- 收藏資料表（使用者收藏的星球）
-- ========================================
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,              -- 收藏紀錄自動遞增編號
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,        -- 使用者 id，使用者刪除時連帶刪除收藏紀錄
    planets_id VARCHAR(50) NOT NULL REFERENCES planets(id) ON DELETE CASCADE,  -- 星球 id，星球刪除時連帶刪除收藏紀錄
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- 收藏建立時間
    UNIQUE (user_id, planets_id)        -- 同一使用者不可重複收藏同一星球
);


COMMIT;
