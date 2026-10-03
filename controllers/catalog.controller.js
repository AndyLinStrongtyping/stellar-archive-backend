const { pool } = require('../db/pg');

const planetColumns = `id, galaxy_id AS galaxy, type, name, en, coord,
  difficulty, uses, summary, body, author, source_url AS "sourceUrl",
  license, compatible_agents AS "compatibleAgents", version,
  updated_at AS "updatedAt"`;

const normalize = (value) => String(value ?? '').trim();

const getGalaxies = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, en, color, description AS "desc"
       FROM galaxies
       ORDER BY created_at, id`,
    );
    res.status(200).json({ message: 'success', data: result.rows });
  } catch (error) {
    next(error);
  }
};

const getPlanets = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ${planetColumns}
       FROM planets
       ORDER BY created_at, id`,
    );
    res.status(200).json({ message: 'success', data: result.rows });
  } catch (error) {
    next(error);
  }
};

const searchPlanets = async (req, res, next) => {
  try {
    const keyword = normalize(req.query.keyword);
    const galaxy = normalize(req.query.galaxy);
    const type = normalize(req.query.type);

    if (type && !['skill', 'prompt'].includes(type)) {
      return res.status(400).json({ message: 'type must be skill or prompt' });
    }
    if (galaxy) {
      const galaxyResult = await pool.query('SELECT 1 FROM galaxies WHERE id = $1', [galaxy]);
      if (galaxyResult.rowCount === 0) return res.status(404).json({ message: 'Galaxy not found' });
    }

    const values = [];
    const clauses = [];
    if (keyword) {
      values.push(`%${keyword}%`);
      clauses.push(`(name ILIKE $${values.length} OR en ILIKE $${values.length}
        OR summary ILIKE $${values.length} OR body ILIKE $${values.length}
        OR author ILIKE $${values.length})`);
    }
    if (galaxy) {
      values.push(galaxy);
      clauses.push(`galaxy_id = $${values.length}`);
    }
    if (type) {
      values.push(type);
      clauses.push(`type = $${values.length}`);
    }
    const result = await pool.query(
      `SELECT ${planetColumns} FROM planets
       ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
       ORDER BY created_at, id`,
      values,
    );
    res.status(200).json({ message: 'success', data: result.rows });
  } catch (error) {
    next(error);
  }
};

const getPlanetById = async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT ${planetColumns} FROM planets WHERE id = $1`, [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Planet not found' });
    res.status(200).json({ message: 'success', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = { getGalaxies, getPlanets, searchPlanets, getPlanetById };
