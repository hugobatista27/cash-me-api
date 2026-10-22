import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'coupon_redemptions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('used_by_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['used_by_user_id'])
      table.dropColumn('used_by_user_id')
    })
  }
}
