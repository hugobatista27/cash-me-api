import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'coupon_redemptions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['status', 'expires_at'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['status', 'expires_at'])
    })
  }
}
