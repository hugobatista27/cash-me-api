import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_establishments'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .foreign('establishment_id')
        .references('id')
        .inTable('establishments')
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['establishment_id'])
    })
  }
}
