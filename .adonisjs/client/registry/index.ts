/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'auth.new_account.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/signup',
    tokens: [{"old":"/api/v1/auth/signup","type":0,"val":"api","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['auth.new_account.store']['types'],
  },
  'auth.user_customers.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/customer/signup',
    tokens: [{"old":"/api/v1/auth/customer/signup","type":0,"val":"api","end":""},{"old":"/api/v1/auth/customer/signup","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/customer/signup","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/customer/signup","type":0,"val":"customer","end":""},{"old":"/api/v1/auth/customer/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['auth.user_customers.store']['types'],
  },
  'auth.user_establishments.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/establishment/signup',
    tokens: [{"old":"/api/v1/auth/establishment/signup","type":0,"val":"api","end":""},{"old":"/api/v1/auth/establishment/signup","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/establishment/signup","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/establishment/signup","type":0,"val":"establishment","end":""},{"old":"/api/v1/auth/establishment/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['auth.user_establishments.store']['types'],
  },
  'auth.user_establishments.register': {
    methods: ["POST"],
    pattern: '/api/v1/auth/establishment/register',
    tokens: [{"old":"/api/v1/auth/establishment/register","type":0,"val":"api","end":""},{"old":"/api/v1/auth/establishment/register","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/establishment/register","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/establishment/register","type":0,"val":"establishment","end":""},{"old":"/api/v1/auth/establishment/register","type":0,"val":"register","end":""}],
    types: placeholder as Registry['auth.user_establishments.register']['types'],
  },
  'auth.access_tokens.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [{"old":"/api/v1/auth/login","type":0,"val":"api","end":""},{"old":"/api/v1/auth/login","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/login","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.access_tokens.store']['types'],
  },
  'profile.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [{"old":"/api/v1/account/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.profile.show']['types'],
  },
  'profile.user_customers.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/customer/profile',
    tokens: [{"old":"/api/v1/account/customer/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/customer/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/customer/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/customer/profile","type":0,"val":"customer","end":""},{"old":"/api/v1/account/customer/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.user_customers.show']['types'],
  },
  'profile.user_customers.update': {
    methods: ["PUT"],
    pattern: '/api/v1/account/customer/profile',
    tokens: [{"old":"/api/v1/account/customer/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/customer/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/customer/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/customer/profile","type":0,"val":"customer","end":""},{"old":"/api/v1/account/customer/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.user_customers.update']['types'],
  },
  'profile.user_establishments.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/establishment/profile',
    tokens: [{"old":"/api/v1/account/establishment/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/establishment/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/establishment/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/establishment/profile","type":0,"val":"establishment","end":""},{"old":"/api/v1/account/establishment/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.user_establishments.show']['types'],
  },
  'profile.user_establishments.update': {
    methods: ["PUT"],
    pattern: '/api/v1/account/establishment/profile',
    tokens: [{"old":"/api/v1/account/establishment/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/establishment/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/establishment/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/establishment/profile","type":0,"val":"establishment","end":""},{"old":"/api/v1/account/establishment/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.user_establishments.update']['types'],
  },
  'profile.access_tokens.destroy': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [{"old":"/api/v1/account/logout","type":0,"val":"api","end":""},{"old":"/api/v1/account/logout","type":0,"val":"v1","end":""},{"old":"/api/v1/account/logout","type":0,"val":"account","end":""},{"old":"/api/v1/account/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['profile.access_tokens.destroy']['types'],
  },
  'customer.customer_invoices.process': {
    methods: ["POST"],
    pattern: '/api/v1/customer/invoices/process',
    tokens: [{"old":"/api/v1/customer/invoices/process","type":0,"val":"api","end":""},{"old":"/api/v1/customer/invoices/process","type":0,"val":"v1","end":""},{"old":"/api/v1/customer/invoices/process","type":0,"val":"customer","end":""},{"old":"/api/v1/customer/invoices/process","type":0,"val":"invoices","end":""},{"old":"/api/v1/customer/invoices/process","type":0,"val":"process","end":""}],
    types: placeholder as Registry['customer.customer_invoices.process']['types'],
  },
  'customer.customer_invoices.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/customer/invoices',
    tokens: [{"old":"/api/v1/customer/invoices","type":0,"val":"api","end":""},{"old":"/api/v1/customer/invoices","type":0,"val":"v1","end":""},{"old":"/api/v1/customer/invoices","type":0,"val":"customer","end":""},{"old":"/api/v1/customer/invoices","type":0,"val":"invoices","end":""}],
    types: placeholder as Registry['customer.customer_invoices.index']['types'],
  },
  'customer.customer_invoices.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/customer/invoices/:id',
    tokens: [{"old":"/api/v1/customer/invoices/:id","type":0,"val":"api","end":""},{"old":"/api/v1/customer/invoices/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/customer/invoices/:id","type":0,"val":"customer","end":""},{"old":"/api/v1/customer/invoices/:id","type":0,"val":"invoices","end":""},{"old":"/api/v1/customer/invoices/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['customer.customer_invoices.show']['types'],
  },
  'customer.customer_points.balances': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/customer/balances',
    tokens: [{"old":"/api/v1/customer/balances","type":0,"val":"api","end":""},{"old":"/api/v1/customer/balances","type":0,"val":"v1","end":""},{"old":"/api/v1/customer/balances","type":0,"val":"customer","end":""},{"old":"/api/v1/customer/balances","type":0,"val":"balances","end":""}],
    types: placeholder as Registry['customer.customer_points.balances']['types'],
  },
  'customer.customer_points.statement': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/customer/establishments/:establishmentId/statement',
    tokens: [{"old":"/api/v1/customer/establishments/:establishmentId/statement","type":0,"val":"api","end":""},{"old":"/api/v1/customer/establishments/:establishmentId/statement","type":0,"val":"v1","end":""},{"old":"/api/v1/customer/establishments/:establishmentId/statement","type":0,"val":"customer","end":""},{"old":"/api/v1/customer/establishments/:establishmentId/statement","type":0,"val":"establishments","end":""},{"old":"/api/v1/customer/establishments/:establishmentId/statement","type":1,"val":"establishmentId","end":""},{"old":"/api/v1/customer/establishments/:establishmentId/statement","type":0,"val":"statement","end":""}],
    types: placeholder as Registry['customer.customer_points.statement']['types'],
  },
  'establishments.establishments.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/establishments',
    tokens: [{"old":"/api/v1/establishments","type":0,"val":"api","end":""},{"old":"/api/v1/establishments","type":0,"val":"v1","end":""},{"old":"/api/v1/establishments","type":0,"val":"establishments","end":""}],
    types: placeholder as Registry['establishments.establishments.index']['types'],
  },
  'establishments.establishments.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/establishments/:id',
    tokens: [{"old":"/api/v1/establishments/:id","type":0,"val":"api","end":""},{"old":"/api/v1/establishments/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/establishments/:id","type":0,"val":"establishments","end":""},{"old":"/api/v1/establishments/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['establishments.establishments.show']['types'],
  },
  'establishments.establishments.store': {
    methods: ["POST"],
    pattern: '/api/v1/establishments',
    tokens: [{"old":"/api/v1/establishments","type":0,"val":"api","end":""},{"old":"/api/v1/establishments","type":0,"val":"v1","end":""},{"old":"/api/v1/establishments","type":0,"val":"establishments","end":""}],
    types: placeholder as Registry['establishments.establishments.store']['types'],
  },
  'establishments.establishments.update': {
    methods: ["PUT"],
    pattern: '/api/v1/establishments/:id',
    tokens: [{"old":"/api/v1/establishments/:id","type":0,"val":"api","end":""},{"old":"/api/v1/establishments/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/establishments/:id","type":0,"val":"establishments","end":""},{"old":"/api/v1/establishments/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['establishments.establishments.update']['types'],
  },
  'establishments.establishments.show_address': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/establishments/:id/address',
    tokens: [{"old":"/api/v1/establishments/:id/address","type":0,"val":"api","end":""},{"old":"/api/v1/establishments/:id/address","type":0,"val":"v1","end":""},{"old":"/api/v1/establishments/:id/address","type":0,"val":"establishments","end":""},{"old":"/api/v1/establishments/:id/address","type":1,"val":"id","end":""},{"old":"/api/v1/establishments/:id/address","type":0,"val":"address","end":""}],
    types: placeholder as Registry['establishments.establishments.show_address']['types'],
  },
  'establishments.establishments.update_address': {
    methods: ["PUT"],
    pattern: '/api/v1/establishments/:id/address',
    tokens: [{"old":"/api/v1/establishments/:id/address","type":0,"val":"api","end":""},{"old":"/api/v1/establishments/:id/address","type":0,"val":"v1","end":""},{"old":"/api/v1/establishments/:id/address","type":0,"val":"establishments","end":""},{"old":"/api/v1/establishments/:id/address","type":1,"val":"id","end":""},{"old":"/api/v1/establishments/:id/address","type":0,"val":"address","end":""}],
    types: placeholder as Registry['establishments.establishments.update_address']['types'],
  },
  'establishments.approve': {
    methods: ["PATCH"],
    pattern: '/api/v1/establishments/:id/approve',
    tokens: [{"old":"/api/v1/establishments/:id/approve","type":0,"val":"api","end":""},{"old":"/api/v1/establishments/:id/approve","type":0,"val":"v1","end":""},{"old":"/api/v1/establishments/:id/approve","type":0,"val":"establishments","end":""},{"old":"/api/v1/establishments/:id/approve","type":1,"val":"id","end":""},{"old":"/api/v1/establishments/:id/approve","type":0,"val":"approve","end":""}],
    types: placeholder as Registry['establishments.approve']['types'],
  },
  'establishment.establishment_rules.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/establishment/loyalty-rule',
    tokens: [{"old":"/api/v1/establishment/loyalty-rule","type":0,"val":"api","end":""},{"old":"/api/v1/establishment/loyalty-rule","type":0,"val":"v1","end":""},{"old":"/api/v1/establishment/loyalty-rule","type":0,"val":"establishment","end":""},{"old":"/api/v1/establishment/loyalty-rule","type":0,"val":"loyalty-rule","end":""}],
    types: placeholder as Registry['establishment.establishment_rules.show']['types'],
  },
  'establishment.establishment_rules.simulate': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/establishment/loyalty-rule/simulate',
    tokens: [{"old":"/api/v1/establishment/loyalty-rule/simulate","type":0,"val":"api","end":""},{"old":"/api/v1/establishment/loyalty-rule/simulate","type":0,"val":"v1","end":""},{"old":"/api/v1/establishment/loyalty-rule/simulate","type":0,"val":"establishment","end":""},{"old":"/api/v1/establishment/loyalty-rule/simulate","type":0,"val":"loyalty-rule","end":""},{"old":"/api/v1/establishment/loyalty-rule/simulate","type":0,"val":"simulate","end":""}],
    types: placeholder as Registry['establishment.establishment_rules.simulate']['types'],
  },
  'establishment.establishment_rules.history': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/establishment/loyalty-rule/history',
    tokens: [{"old":"/api/v1/establishment/loyalty-rule/history","type":0,"val":"api","end":""},{"old":"/api/v1/establishment/loyalty-rule/history","type":0,"val":"v1","end":""},{"old":"/api/v1/establishment/loyalty-rule/history","type":0,"val":"establishment","end":""},{"old":"/api/v1/establishment/loyalty-rule/history","type":0,"val":"loyalty-rule","end":""},{"old":"/api/v1/establishment/loyalty-rule/history","type":0,"val":"history","end":""}],
    types: placeholder as Registry['establishment.establishment_rules.history']['types'],
  },
  'establishment.establishment_rules.update': {
    methods: ["PUT"],
    pattern: '/api/v1/establishment/loyalty-rule',
    tokens: [{"old":"/api/v1/establishment/loyalty-rule","type":0,"val":"api","end":""},{"old":"/api/v1/establishment/loyalty-rule","type":0,"val":"v1","end":""},{"old":"/api/v1/establishment/loyalty-rule","type":0,"val":"establishment","end":""},{"old":"/api/v1/establishment/loyalty-rule","type":0,"val":"loyalty-rule","end":""}],
    types: placeholder as Registry['establishment.establishment_rules.update']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
