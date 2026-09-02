import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.user_customers.store': { paramsTuple?: []; params?: {} }
    'auth.user_establishments.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.user_customers.show': { paramsTuple?: []; params?: {} }
    'profile.user_customers.update': { paramsTuple?: []; params?: {} }
    'profile.user_establishments.show': { paramsTuple?: []; params?: {} }
    'profile.user_establishments.update': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.user_customers.show': { paramsTuple?: []; params?: {} }
    'profile.user_establishments.show': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.user_customers.show': { paramsTuple?: []; params?: {} }
    'profile.user_establishments.show': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.user_customers.store': { paramsTuple?: []; params?: {} }
    'auth.user_establishments.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'profile.user_customers.update': { paramsTuple?: []; params?: {} }
    'profile.user_establishments.update': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}