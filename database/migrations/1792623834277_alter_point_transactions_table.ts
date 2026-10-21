import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'point_transactions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('coupon_redemption_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('coupon_redemptions')
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['coupon_redemption_id'])
      table.dropColumn('coupon_redemption_id')
    })
  }
}
