const { pool } = require("../db/pg");

// 驗證新增星系的必填欄位
const validateCreateGalaxy = (req, res, next) => {
    const { id, name, en, color, desc } = req.body ?? {};

    if (!id || !name || !en || !color || !desc) {
        return res.status(400).json({
            message: "請填寫完整的星系資料",
        });
    }

    next();
};

// 驗證星系 ID 是否重複
const checkGalaxyIdDuplicate = async (req, res, next) => {
    const result = await pool.query(
        "SELECT 1 FROM galaxies WHERE id = $1",
        [req.body.id]
    );

    if (result.rowCount > 0) {
        return res.status(409).json({
            message: "星系 ID 已存在",
        });
    }

    next();
};


// 對星系資料是否存在
const findGalaxyById = async (req, res, next) => {
    const result = await pool.query(
        `SELECT id, name, en, color, description AS "desc"
         FROM galaxies
         WHERE id = $1`,
        [req.params.id]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({
            message: "找不到指定的星系",
        });
    }

    req.galaxy = result.rows[0];
    next();
};


// 行星資料填寫是否完整
const validateCreatePlanet = (req, res, next) => {
    const {
        galaxy,
        type,
        name,
        en,
        coord,
        difficulty,
        summary,
        body,
        author,
        license,
        version,
    } = req.body ?? {};

    if (
        !galaxy ||
        !type ||
        !name ||
        !en ||
        !coord ||
        difficulty === undefined ||
        !summary ||
        !body ||
        !author ||
        !license ||
        !version
    ) {
        return res.status(400).json({
            message: "欄位資料不完整",
        });
    }

    next();
};


// 對行星資料是否存在
const findPlanetById = async (req, res, next) => {
    const result = await pool.query(
        `SELECT id, galaxy_id AS galaxy, type, name, en, coord,
                difficulty, uses, summary, body, author,
                source_url AS "sourceUrl", license,
                compatible_agents AS "compatibleAgents", version,
                updated_at AS "updatedAt"
         FROM planets
         WHERE id = $1`,
        [req.params.id]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({
            message: "找不到指定的行星",
        });
    }

    req.planet = result.rows[0];
    next();
};

module.exports = {
    validateCreateGalaxy,
    checkGalaxyIdDuplicate,
    findGalaxyById,
    validateCreatePlanet,
    findPlanetById,
};
