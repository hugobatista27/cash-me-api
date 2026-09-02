import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_customers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .unique()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('full_name', 255).notNullable()
      table.string('cpf', 11).nullable().unique()
      table.string('phone', 20).nullable()
      table.string('auth_provider', 50).notNullable().defaultTo('LOCAL')
      table.string('social_id', 255).nullable()
      table.timestamp('terms_accepted_at').nullable()
      table.string('device_token', 255).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}