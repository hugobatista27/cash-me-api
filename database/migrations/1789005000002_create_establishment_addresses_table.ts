import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'establishment_addresses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('establishment_id')
        .unsigned()
        .notNullable()
        .unique()
        .references('id')
        .inTable('establishments')
        .onDelete('CASCADE')
      table.string('postal_code', 8).notNullable()
      table.string('state', 2).notNullable()
      table.string('city', 100).notNullable()
      table.string('neighborhood', 100).notNullable()
      table.string('street', 255).notNullable()
      table.string('number', 20).notNullable()
      table.string('complement', 100).nullable()
      table.string('reference', 255).nullable()
      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['state', 'city'])
      table.index(['latitude', 'longitude'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
