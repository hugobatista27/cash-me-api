import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('point_balances', (table) => {
      table.increments('id')
      table
        .integer('customer_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('user_customers')
        .onDelete('CASCADE')
      table
        .integer('establishment_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('establishments')
        .onDelete('CASCADE')
      table.decimal('current_balance', 10, 2).notNullable().defaultTo(0.0)
      table.decimal('total_accumulated', 10, 2).notNullable().defaultTo(0.0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['customer_id', 'establishment_id'])
      table.index(['establishment_id', 'customer_id'])
    })

    this.schema.createTable('point_transactions', (table) => {
      table.increments('id')
      table
        .integer('customer_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('user_customers')
        .onDelete('CASCADE')
      table
        .integer('establishment_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('establishments')
        .onDelete('CASCADE')
      table
        .integer('invoice_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('invoices')
        .onDelete('SET NULL')
      table.string('type', 20).notNullable()
      table.decimal('points', 10, 2).notNullable()
      table.decimal('purchase_amount', 10, 2).nullable()
      table.decimal('applied_conversion_factor', 10, 4).nullable()
      table.string('description', 255).notNullable()
      table.jsonb('metadata').nullable()

      table.timestamp('created_at').notNullable()

      table.index(['establishment_id', 'customer_id', 'created_at'])
      table.index(['customer_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable('point_transactions')
    this.schema.dropTable('point_balances')
  }
}
