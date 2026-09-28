import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'establishments'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('phone', 20).nullable()
      table.string('whatsapp', 20).nullable()
      table.string('email', 254).nullable()
      table.string('website', 255).nullable()
      table.string('instagram', 100).nullable()
      table.jsonb('social_links').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('social_links')
      table.dropColumn('instagram')
      table.dropColumn('website')
      table.dropColumn('email')
      table.dropColumn('whatsapp')
      table.dropColumn('phone')
    })
  }
}
