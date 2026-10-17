import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'rewards'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('establishment_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('establishments')
        .onDelete('CASCADE')
      table.string('title', 255).notNullable()
      table.text('description').nullable()
      table.string('discount_type', 20).notNullable() // 'FIXED' | 'PERCENTAGE'
      table.decimal('discount_value', 10, 2).notNullable()
      table.decimal('min_purchase_amount', 10, 2).nullable()
      table.decimal('max_discount_amount', 10, 2).nullable()
      table.integer('points_cost').unsigned().notNullable()
      table.integer('stock').unsigned().nullable()
      table.integer('validity_days').unsigned().notNullable().defaultTo(30)
      table.string('status', 20).notNullable().defaultTo('ACTIVE') // 'ACTIVE' | 'INACTIVE'

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['establishment_id', 'status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
