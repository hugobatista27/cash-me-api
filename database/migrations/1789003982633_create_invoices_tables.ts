import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('invoices', (table) => {
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
        .nullable()
        .references('id')
        .inTable('establishments')
        .onDelete('SET NULL')
      table.string('access_key', 44).notNullable().unique()
      table.text('qr_code_url').notNullable()
      table.string('issuer_state', 2).notNullable()
      table.string('issuer_cnpj', 14).notNullable()
      table.timestamp('issued_at').notNullable()
      table.decimal('total_amount', 10, 2).notNullable()
      table.decimal('points_awarded', 10, 2).notNullable().defaultTo(0.0)
      table.string('status', 30).notNullable().defaultTo('PENDING')
      table.text('rejection_reason').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['customer_id'])
      table.index(['establishment_id'])
      table.index(['status', 'created_at'])
    })

    this.schema.createTable('invoice_items', (table) => {
      table.increments('id')
      table
        .integer('invoice_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('invoices')
        .onDelete('CASCADE')
      table.string('raw_description', 255).notNullable()
      table.decimal('quantity', 10, 3).notNullable()
      table.decimal('unit_price', 10, 2).notNullable()
      table.decimal('total_price', 10, 2).notNullable()
      table.timestamp('created_at').notNullable()

      table.index(['invoice_id'])
    })
  }

  async down() {
    this.schema.dropTable('invoice_items')
    this.schema.dropTable('invoices')
  }
}
