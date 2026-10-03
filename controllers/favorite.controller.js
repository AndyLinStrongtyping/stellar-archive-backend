const { pool } = require('../db/pg');

// 取得目前登入使用者的收藏，並一併回傳行星內容供前端顯示。
const getFavorites = async (req, res) => {
  const result = await pool.query(
    `SELECT f.id AS favorite_id, f.created_at AS favorited_at,
            p.id, p.galaxy_id AS galaxy, p.type, p.name, p.en, p.coord,
            p.difficulty, p.uses, p.summary, p.body, p.author,
            p.source_url AS "sourceUrl", p.license,
            p.compatible_agents AS "compatibleAgents", p.version,
            p.updated_at AS "updatedAt"
     FROM favorites AS f
     JOIN planets AS p ON p.id = f.planets_id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC, f.id DESC`,
    [req.user.id]
  );

  res.status(200).json({ message: 'success', data: result.rows });
};

const createFavorite = async (req, res) => {
  const { planetId } = req.params;
  const result = await pool.query(
    `INSERT INTO favorites (user_id, planets_id)
     SELECT $1, id
     FROM planets
     WHERE id = $2
     ON CONFLICT (user_id, planets_id) DO NOTHING
     RETURNING id, user_id, planets_id AS planet_id, created_at`,
    [req.user.id, planetId]
  );

  if (result.rowCount === 0) {
    const planet = await pool.query('SELECT 1 FROM planets WHERE id = $1', [planetId]);
    if (planet.rowCount === 0) {
      return res.status(404).json({ message: '找不到指定的行星' });
    }
    return res.status(409).json({ message: '已收藏此行星' });
  }

  res.status(201).json({ message: '收藏成功', data: result.rows[0] });
};

const deleteFavorite = async (req, res) => {
  const result = await pool.query(
    `DELETE FROM favorites
     WHERE user_id = $1 AND planets_id = $2
     RETURNING id, user_id, planets_id AS planet_id, created_at`,
    [req.user.id, req.params.planetId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: '找不到指定的收藏' });
  }

  res.status(200).json({ message: '取消收藏成功', data: result.rows[0] });
};

module.exports = { getFavorites, createFavorite, deleteFavorite };
