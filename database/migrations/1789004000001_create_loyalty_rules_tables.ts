import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('loyalty_programs', (table) => {
      table.increments('id')
      table
        .integer('establishment_id')
        .unsigned()
        .notNullable()
        .unique()
        .references('id')
        .inTable('establishments')
        .onDelete('CASCADE')
      table.string('name', 255).notNullable().defaultTo('Programa de Fidelidade')
      table.string('status', 20).notNullable().defaultTo('ACTIVE')
      table.string('points_currency', 50).notNullable().defaultTo('pontos')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('point_rules', (table) => {
      table.increments('id')
      table
        .integer('loyalty_program_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('loyalty_programs')
        .onDelete('CASCADE')
      table
        .integer('establishment_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('establishments')
        .onDelete('CASCADE')
      table
        .integer('created_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.integer('version').notNullable().defaultTo(1)
      table.string('name', 255).notNullable()
      table.string('status', 20).notNullable().defaultTo('ACTIVE')
      table.decimal('base_amount', 10, 2).notNullable().defaultTo(1.0)
      table.integer('points_per_base').notNullable().defaultTo(1)
      table.decimal('min_purchase_amount', 10, 2).notNullable().defaultTo(0.0)
      table.integer('max_points_per_purchase').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['loyalty_program_id', 'version'])
      table.index(['establishment_id', 'status'])
    })
  }

  async down() {
    this.schema.dropTable('point_rules')
    this.schema.dropTable('loyalty_programs')
  }
}
