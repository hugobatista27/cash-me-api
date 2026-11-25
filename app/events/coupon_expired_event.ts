import { BaseEvent } from '@adonisjs/core/events'
import type CouponRedemption from '#models/coupon_redemption'

export default class CouponExpiredEvent extends BaseEvent {
  constructor(
    public coupon: CouponRedemption,
    public refundedPoints: number
  ) {
    super()
  }
}

declare module '@adonisjs/core/types' {
  interface EventsList {
    'coupon:expired': CouponExpiredEvent
  }
}
