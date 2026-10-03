/**
 * 建立資料表並寫入開發用假資料。
 *
 * 使用方式：
 *   1. docker compose up -d
 *   2. npm run sql
 *
 * 種子資料使用 ON CONFLICT 更新，因此可以安全地重複執行。
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('./pg');

const USERS = [
  {
    // 固定 UUID 讓 seed 可重複執行，且符合 users.id 的 UUID 型別。
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Galaxy Admin',
    email: 'admin@example.com',
    // 測試密碼：admin123
    passwordHash: '$2b$10$KxhZf1cZGDchz.yKFhjyROiadQYhPZkLtBl8ei5E0xbJV4XL82Jka',
    role: 'admin',
  },
];

const GALAXIES = [
  { id: 'words', name: '寫作星系', en: 'NEBULA OF WORDS', color: '#b6a8d6', description: '文案、敘事、潤稿類 prompt 的家園' },
  { id: 'code', name: '程式星系', en: 'CODE CLUSTER', color: '#93c3d8', description: '除錯、重構、架構設計的技能航線' },
  { id: 'market', name: '行銷星系', en: 'MARKET CONSTELLATION', color: '#d8bd8f', description: '品牌、社群、成長策略的行星群' },
];

const PLANETS = [
  { id: 'p1', galaxyId: 'words', type: 'prompt', name: '一句話摘要器', en: 'One-Line Digest', coord: 'WD-104', difficulty: 1, uses: 1280, summary: '把任意長文濃縮成一句直擊重點的話。', body: '你是一位精準的編輯。請將以下內容濃縮為一句不超過 30 字、保留核心洞見的摘要。' },
  { id: 'p2', galaxyId: 'words', type: 'skill', name: '敘事弧線建構', en: 'Story Arc Builder', coord: 'WD-207', difficulty: 3, uses: 640, summary: '為任何主題搭出起承轉合的敘事骨架。', body: '依據「鉤子→衝突→轉折→收束」四段式，為給定主題產出敘事大綱。' },
  { id: 'p3', galaxyId: 'words', type: 'prompt', name: '語氣調校台', en: 'Tone Tuner', coord: 'WD-311', difficulty: 2, uses: 910, summary: '在正式與親切之間自由平移文字語氣。', body: '保留原意，將文字語氣調整為指定風格（例：專業、俏皮、溫暖）。' },
  { id: 'p4', galaxyId: 'words', type: 'prompt', name: '標題生成艙', en: 'Headline Forge', coord: 'WD-418', difficulty: 1, uses: 1520, summary: '一次產出 10 個不同角度的標題。', body: '為給定主題生成 10 個標題，涵蓋懸念、數字、對比、提問等角度。' },
  { id: 'p5', galaxyId: 'words', type: 'skill', name: '潤稿掃描儀', en: 'Polish Scanner', coord: 'WD-522', difficulty: 2, uses: 730, summary: '揪出冗詞、被動語態與模糊表述。', body: '逐句檢查文字，標記冗詞、被動語態、含糊用語並給修改建議。' },
  { id: 'p6', galaxyId: 'code', type: 'skill', name: '除錯羅盤', en: 'Debug Compass', coord: 'CD-102', difficulty: 3, uses: 1840, summary: '從錯誤訊息反推最可能的根因。', body: '根據錯誤訊息與相關程式碼，列出前三個最可能的根因與驗證步驟。' },
  { id: 'p7', galaxyId: 'code', type: 'skill', name: '重構引擎', en: 'Refactor Engine', coord: 'CD-216', difficulty: 4, uses: 960, summary: '在不改行為的前提下改善結構。', body: '對給定函式進行重構，保持行為不變，說明每一步改動的理由。' },
  { id: 'p8', galaxyId: 'code', type: 'prompt', name: '正則咒語書', en: 'Regex Grimoire', coord: 'CD-309', difficulty: 2, uses: 1210, summary: '用自然語言描述換來一條正則式。', body: '將自然語言描述轉換為正則表達式，並附上測試字串範例。' },
  { id: 'p9', galaxyId: 'code', type: 'skill', name: '架構星圖', en: 'Architecture Map', coord: 'CD-411', difficulty: 5, uses: 520, summary: '為需求畫出模組與資料流。', body: '依需求提出系統架構，列出主要模組、資料流與取捨。' },
  { id: 'p10', galaxyId: 'code', type: 'prompt', name: '測試孵化器', en: 'Test Incubator', coord: 'CD-527', difficulty: 3, uses: 880, summary: '為函式產出邊界情境測試案例。', body: '為給定函式產出單元測試，涵蓋正常、邊界與例外情境。' },
  { id: 'p11', galaxyId: 'market', type: 'prompt', name: '口號鍛造爐', en: 'Slogan Foundry', coord: 'MK-101', difficulty: 2, uses: 1050, summary: '為品牌產出朗朗上口的口號。', body: '根據品牌調性與受眾，產出 8 個候選口號並標註風格。' },
  { id: 'p12', galaxyId: 'market', type: 'skill', name: '受眾雷達', en: 'Audience Radar', coord: 'MK-214', difficulty: 3, uses: 690, summary: '描繪目標客群的樣貌與痛點。', body: '為產品建立 3 個受眾輪廓，含動機、痛點與觸及管道。' },
  { id: 'p13', galaxyId: 'market', type: 'prompt', name: '貼文星鏈', en: 'Post Chain', coord: 'MK-322', difficulty: 1, uses: 1380, summary: '一個主題延展成一週社群貼文。', body: '以一個主題為核心，規劃 7 則社群貼文，各具不同切角與 CTA。' },
  { id: 'p14', galaxyId: 'market', type: 'skill', name: '成長飛輪', en: 'Growth Flywheel', coord: 'MK-436', difficulty: 4, uses: 410, summary: '設計自我強化的成長循環。', body: '為產品設計成長飛輪，列出各環節的槓桿與衡量指標。' },
];

const DEFAULT_PLANET_METADATA = {
  author: 'Stellar Archive Team',
  sourceUrl: null,
  license: '未指定',
  compatibleAgents: ['ChatGPT', 'Claude', 'Gemini'],
  version: '1.0.0',
};

const userSql = `
  INSERT INTO users (id, name, email, password_hash, role)
  VALUES ($1, $2, $3, $4, $5)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP
`;

const galaxySql = `
  INSERT INTO galaxies (id, name, en, color, description)
  VALUES ($1, $2, $3, $4, $5)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    en = EXCLUDED.en,
    color = EXCLUDED.color,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP
`;

const planetSql = `
  INSERT INTO planets
    (id, galaxy_id, type, name, en, coord, difficulty, uses, summary, body,
     author, source_url, license, compatible_agents, version)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  ON CONFLICT (id) DO UPDATE SET
    galaxy_id = EXCLUDED.galaxy_id,
    type = EXCLUDED.type,
    name = EXCLUDED.name,
    en = EXCLUDED.en,
    coord = EXCLUDED.coord,
    difficulty = EXCLUDED.difficulty,
    uses = EXCLUDED.uses,
    summary = EXCLUDED.summary,
    body = EXCLUDED.body,
    author = EXCLUDED.author,
    source_url = EXCLUDED.source_url,
    license = EXCLUDED.license,
    compatible_agents = EXCLUDED.compatible_agents,
    version = EXCLUDED.version,
    updated_at = CURRENT_TIMESTAMP
`;

async function seedDatabase() {
  const client = createClient();
  const schemaPath = path.join(__dirname, 'seed_data.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    await client.connect();
    await client.query(schemaSql);
    await client.query('BEGIN');

    for (const user of USERS) {
      await client.query(userSql, [
        user.id,
        user.name,
        user.email.toLowerCase(),
        user.passwordHash,
        user.role,
      ]);
    }

    for (const galaxy of GALAXIES) {
      await client.query(galaxySql, [
        galaxy.id,
        galaxy.name,
        galaxy.en,
        galaxy.color,
        galaxy.description,
      ]);
    }

    for (const planet of PLANETS) {
      await client.query(planetSql, [
        planet.id,
        planet.galaxyId,
        planet.type,
        planet.name,
        planet.en,
        planet.coord,
        planet.difficulty,
        planet.uses,
        planet.summary,
        planet.body,
        planet.author ?? DEFAULT_PLANET_METADATA.author,
        planet.sourceUrl ?? DEFAULT_PLANET_METADATA.sourceUrl,
        planet.license ?? DEFAULT_PLANET_METADATA.license,
        planet.compatibleAgents ?? DEFAULT_PLANET_METADATA.compatibleAgents,
        planet.version ?? DEFAULT_PLANET_METADATA.version,
      ]);
    }

    await client.query('COMMIT');
    console.log(`Seed 完成：${USERS.length} 位使用者、${GALAXIES.length} 個星系、${PLANETS.length} 顆行星。`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Seed 失敗：', error.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

seedDatabase();
