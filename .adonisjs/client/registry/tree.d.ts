/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
    }
    userCustomers: {
      store: typeof routes['auth.user_customers.store']
    }
    userEstablishments: {
      store: typeof routes['auth.user_establishments.store']
    }
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
    userCustomers: {
      show: typeof routes['profile.user_customers.show']
      update: typeof routes['profile.user_customers.update']
    }
    userEstablishments: {
      show: typeof routes['profile.user_establishments.show']
      update: typeof routes['profile.user_establishments.update']
    }
    accessTokens: {
      destroy: typeof routes['profile.access_tokens.destroy']
    }
  }
}
