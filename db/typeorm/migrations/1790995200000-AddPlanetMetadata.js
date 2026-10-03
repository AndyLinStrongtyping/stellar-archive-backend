module.exports = class AddPlanetMetadata1790995200000 {
  name = 'AddPlanetMetadata1790995200000';

  async up(queryRunner) {
    await queryRunner.query(`
      ALTER TABLE planets
        ADD COLUMN IF NOT EXISTS author VARCHAR(150) NOT NULL DEFAULT 'Stellar Archive Team',
        ADD COLUMN IF NOT EXISTS source_url TEXT,
        ADD COLUMN IF NOT EXISTS license VARCHAR(100) NOT NULL DEFAULT '未指定',
        ADD COLUMN IF NOT EXISTS compatible_agents TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        ADD COLUMN IF NOT EXISTS version VARCHAR(50) NOT NULL DEFAULT '1.0.0'
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`
      ALTER TABLE planets
        DROP COLUMN IF EXISTS version,
        DROP COLUMN IF EXISTS compatible_agents,
        DROP COLUMN IF EXISTS license,
        DROP COLUMN IF EXISTS source_url,
        DROP COLUMN IF EXISTS author
    `);
  }
};
