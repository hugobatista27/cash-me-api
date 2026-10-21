import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import UserEstablishment from '#models/user_establishment'
import UserCustomer from '#models/user_customer'
import CouponRedemption from '#models/coupon_redemption'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  @hasOne(() => UserEstablishment)
  declare establishmentProfile: HasOne<typeof UserEstablishment>

  @hasOne(() => UserCustomer)
  declare customerProfile: HasOne<typeof UserCustomer>

  @hasMany(() => CouponRedemption, { foreignKey: 'customerId' })
  declare couponRedemptions: HasMany<typeof CouponRedemption>
}
