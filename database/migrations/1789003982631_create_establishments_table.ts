import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'establishments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('cnpj', 14).notNullable().unique()
      table.string('legal_name', 255).notNullable()
      table.string('trade_name', 255).notNullable()
      table.string('status', 20).notNullable().defaultTo('PENDING')
      table.decimal('conversion_factor', 10, 4).notNullable().defaultTo(1.0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
