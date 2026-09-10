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
    'customer.customer_invoices.process': { paramsTuple?: []; params?: {} }
    'customer.customer_invoices.index': { paramsTuple?: []; params?: {} }
    'customer.customer_invoices.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customer.customer_points.balances': { paramsTuple?: []; params?: {} }
    'customer.customer_points.statement': { paramsTuple: [ParamValue]; params: {'establishmentId': ParamValue} }
    'establishments.establishments.index': { paramsTuple?: []; params?: {} }
    'establishments.establishments.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'establishments.establishments.store': { paramsTuple?: []; params?: {} }
    'establishments.establishments.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.user_customers.show': { paramsTuple?: []; params?: {} }
    'profile.user_establishments.show': { paramsTuple?: []; params?: {} }
    'customer.customer_invoices.index': { paramsTuple?: []; params?: {} }
    'customer.customer_invoices.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customer.customer_points.balances': { paramsTuple?: []; params?: {} }
    'customer.customer_points.statement': { paramsTuple: [ParamValue]; params: {'establishmentId': ParamValue} }
    'establishments.establishments.index': { paramsTuple?: []; params?: {} }
    'establishments.establishments.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.user_customers.show': { paramsTuple?: []; params?: {} }
    'profile.user_establishments.show': { paramsTuple?: []; params?: {} }
    'customer.customer_invoices.index': { paramsTuple?: []; params?: {} }
    'customer.customer_invoices.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customer.customer_points.balances': { paramsTuple?: []; params?: {} }
    'customer.customer_points.statement': { paramsTuple: [ParamValue]; params: {'establishmentId': ParamValue} }
    'establishments.establishments.index': { paramsTuple?: []; params?: {} }
    'establishments.establishments.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.user_customers.store': { paramsTuple?: []; params?: {} }
    'auth.user_establishments.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'customer.customer_invoices.process': { paramsTuple?: []; params?: {} }
    'establishments.establishments.store': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'profile.user_customers.update': { paramsTuple?: []; params?: {} }
    'profile.user_establishments.update': { paramsTuple?: []; params?: {} }
    'establishments.establishments.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}