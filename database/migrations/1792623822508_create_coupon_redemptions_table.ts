import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'coupon_redemptions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('customer_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('establishment_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('establishments')
        .onDelete('CASCADE')
      table
        .integer('reward_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('rewards')
        .onDelete('CASCADE')
      table.string('code', 20).notNullable().unique()
      table.integer('points_cost').unsigned().notNullable()
      table.string('status', 20).notNullable().defaultTo('ACTIVE')
      table.timestamp('expires_at').notNullable()
      table.timestamp('used_at').nullable()
      table.timestamp('cancelled_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['customer_id', 'status'])
      table.index(['establishment_id', 'status'])
      table.index(['code'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
