const { EntitySchema } = require('typeorm');

const PlanetEntity = new EntitySchema({
  name: 'Planet',
  tableName: 'planets',
  columns: {
    id: {
      type: 'varchar',
      length: 50,
      primary: true,
    },
    galaxyId: {
      name: 'galaxy_id',
      type: 'varchar',
      length: 50,
    },
    type: {
      type: 'varchar',
      length: 20,
    },
    name: {
      type: 'varchar',
      length: 150,
    },
    en: {
      type: 'varchar',
      length: 150,
    },
    coord: {
      type: 'varchar',
      length: 30,
      unique: true,
    },
    difficulty: {
      type: 'smallint',
    },
    uses: {
      type: 'integer',
      default: 0,
    },
    summary: {
      type: 'text',
    },
    body: {
      type: 'text',
    },
    author: {
      type: 'varchar',
      length: 150,
      default: 'Stellar Archive Team',
    },
    sourceUrl: {
      name: 'source_url',
      type: 'text',
      nullable: true,
    },
    license: {
      type: 'varchar',
      length: 100,
      default: '未指定',
    },
    compatibleAgents: {
      name: 'compatible_agents',
      type: 'text',
      array: true,
      default: () => "ARRAY[]::text[]",
    },
    version: {
      type: 'varchar',
      length: 50,
      default: '1.0.0',
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      createDate: true,
      default: () => 'CURRENT_TIMESTAMP',
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      updateDate: true,
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
  relations: {
    galaxy: {
      type: 'many-to-one',
      target: 'Galaxy',
      inverseSide: 'planets',
      joinColumn: {
        name: 'galaxy_id',
        referencedColumnName: 'id',
        foreignKeyConstraintName: 'planets_galaxy_fk',
      },
      nullable: false,
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    favorites: {
      type: 'one-to-many',
      target: 'Favorite',
      inverseSide: 'planet',
    },
  },
  indices: [
    {
      name: 'planets_galaxy_id_idx',
      columns: ['galaxyId'],
    },
  ],
  checks: [
    {
      name: 'planets_type_check',
      expression: '"type" IN (\'prompt\', \'skill\')',
    },
    {
      name: 'planets_difficulty_check',
      expression: '"difficulty" BETWEEN 1 AND 5',
    },
    {
      name: 'planets_uses_check',
      expression: '"uses" >= 0',
    },
  ],
});

module.exports = { PlanetEntity };
