import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'point_transactions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('rule_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('point_rules')
        .onDelete('SET NULL')
      table.integer('rule_version').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('rule_version')
      table.dropForeign(['rule_id'])
      table.dropColumn('rule_id')
    })
  }
}
