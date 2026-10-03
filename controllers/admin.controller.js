const { pool } = require("../db/pg");

const planetColumns = `id, galaxy_id AS galaxy, type, name, en, coord,
  difficulty, uses, summary, body, author, source_url AS "sourceUrl",
  license, compatible_agents AS "compatibleAgents", version,
  updated_at AS "updatedAt"`;


//取得星系
const getGalaxies = async (req, res) => {
    const result = await pool.query(
        `SELECT id, name, en, color, description AS "desc"
         FROM galaxies
         ORDER BY created_at, id`
    );
    res.status(200).json({
        message: "success",
        data: result.rows,
    });
};

// 新增星系
const createGalaxy = async (req, res) => {
    const { id, name, en, color, desc } = req.body;

    const result = await pool.query(
        `INSERT INTO galaxies (id, name, en, color, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, en, color, description AS "desc"`,
        [id, name, en, color, desc]
    );

    res.status(200).json({
        message: "新增星系成功",
        data: result.rows[0],
    });
};


//修改星系
const updateGalaxy = async (req, res) => {
    const body = req.body ?? {};
    const allowedFields = ["name", "en", "color", "desc"];

    const columnMap = { name: "name", en: "en", color: "color", desc: "description" };
    const values = [];
    const assignments = [];

    allowedFields.forEach((field) => {
        if (body[field] !== undefined) {
            values.push(body[field]);
            assignments.push(`${columnMap[field]} = $${values.length}`);
        }
    });

    if (assignments.length === 0) {
        return res.status(200).json({ message: "修改星系成功", data: req.galaxy });
    }

    values.push(req.params.id);
    const result = await pool.query(
        `UPDATE galaxies
         SET ${assignments.join(", ")}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${values.length}
         RETURNING id, name, en, color, description AS "desc"`,
        values
    );

    res.status(200).json({
        message: "修改星系成功",
        data: result.rows[0],
    });
};


//刪除星系
const deleteGalaxy = async (req, res) => {
    const result = await pool.query(
        `DELETE FROM galaxies
         WHERE id = $1
         RETURNING id, name, en, color, description AS "desc"`,
        [req.params.id]
    );

    res.status(200).json({
        message: "刪除星系成功",
        data: result.rows[0],
    });
};


//取得&篩選行星
const getPlanets = async (req, res) => {
    const { galaxy } = req.query;
    const baseSql = `SELECT ${planetColumns} FROM planets`;
    const result = galaxy
        ? await pool.query(`${baseSql} WHERE galaxy_id = $1 ORDER BY created_at, id`, [galaxy])
        : await pool.query(`${baseSql} ORDER BY created_at, id`);

    if (galaxy && result.rowCount === 0) {
        return res.status(404).json({
            message: "沒有找到你所篩選的星系",
        });
    }

    res.status(200).json({
        message: galaxy ? "篩選成功" : "success",
        data: result.rows,
    });
};

//新增行星
const createPlanet = async (req, res) => {
    const {
        galaxy,
        type,
        name,
        en,
        coord,
        difficulty,
        uses,
        summary,
        body,
        author,
        sourceUrl,
        license,
        compatibleAgents,
        version,
    } = req.body;

    const client = await pool.connect();
    let newPlanet;
    try {
        await client.query("BEGIN");
        // 鎖住 ID 產生區段，避免兩個新增請求同時得到相同的 p 編號。
        await client.query("SELECT pg_advisory_xact_lock($1)", [731042]);
        const idResult = await client.query(
            `SELECT 'p' || (COALESCE(MAX(SUBSTRING(id FROM 2)::integer), 0) + 1) AS id
             FROM planets
             WHERE id ~ '^p[0-9]+$'`
        );
        const result = await client.query(
            `INSERT INTO planets
                (id, galaxy_id, type, name, en, coord, difficulty, uses, summary,
                 body, author, source_url, license, compatible_agents, version)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             RETURNING ${planetColumns}`,
            [
                idResult.rows[0].id,
                galaxy,
                type,
                name,
                en,
                coord,
                difficulty,
                uses ?? 0,
                summary,
                body,
                author,
                sourceUrl || null,
                license,
                Array.isArray(compatibleAgents) ? compatibleAgents : [],
                version,
            ]
        );
        newPlanet = result.rows[0];
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }

    res.status(200).json({
        message: "新增行星成功",
        data: newPlanet,
    });
};


//修改行星
const updatePlanet = async (req, res) => {
    const body = req.body ?? {};
    const allowedFields = [
        "galaxy",
        "type",
        "name",
        "en",
        "coord",
        "difficulty",
        "uses",
        "summary",
        "body",
        "author",
        "sourceUrl",
        "license",
        "compatibleAgents",
        "version",
    ];
    const columnMap = {
        galaxy: "galaxy_id",
        type: "type",
        name: "name",
        en: "en",
        coord: "coord",
        difficulty: "difficulty",
        uses: "uses",
        summary: "summary",
        body: "body",
        author: "author",
        sourceUrl: "source_url",
        license: "license",
        compatibleAgents: "compatible_agents",
        version: "version",
    };
    const values = [];
    const assignments = [];

    allowedFields.forEach((field) => {
        if (body[field] !== undefined) {
            values.push(body[field]);
            assignments.push(`${columnMap[field]} = $${values.length}`);
        }
    });

    if (assignments.length === 0) {
        return res.status(200).json({ message: "修改行星成功", data: req.planet });
    }

    values.push(req.params.id);
    const result = await pool.query(
        `UPDATE planets
         SET ${assignments.join(", ")}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${values.length}
         RETURNING ${planetColumns}`,
        values
    );

    res.status(200).json({
        message: "修改行星成功",
        data: result.rows[0],
    });
};


//刪除行星
const deletePlanet = async (req, res) => {
    const result = await pool.query(
        `DELETE FROM planets
         WHERE id = $1
         RETURNING ${planetColumns}`,
        [req.params.id]
    );

    res.status(200).json({
        message: "刪除行星成功",
        data: result.rows[0],
    });
};

module.exports = {
    getGalaxies,
    createGalaxy,
    updateGalaxy,
    deleteGalaxy,
    getPlanets,
    createPlanet,
    updatePlanet,
    deletePlanet,
};
