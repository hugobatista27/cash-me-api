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
