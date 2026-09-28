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
      register: typeof routes['auth.user_establishments.register']
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
  customer: {
    customerInvoices: {
      process: typeof routes['customer.customer_invoices.process']
      index: typeof routes['customer.customer_invoices.index']
      show: typeof routes['customer.customer_invoices.show']
    }
    customerPoints: {
      balances: typeof routes['customer.customer_points.balances']
      statement: typeof routes['customer.customer_points.statement']
    }
  }
  establishments: {
    establishments: {
      index: typeof routes['establishments.establishments.index']
      show: typeof routes['establishments.establishments.show']
      store: typeof routes['establishments.establishments.store']
      update: typeof routes['establishments.establishments.update']
      showAddress: typeof routes['establishments.establishments.show_address']
      updateAddress: typeof routes['establishments.establishments.update_address']
    }
    approve: typeof routes['establishments.approve']
  }
  establishment: {
    establishmentRules: {
      show: typeof routes['establishment.establishment_rules.show']
      simulate: typeof routes['establishment.establishment_rules.simulate']
      history: typeof routes['establishment.establishment_rules.history']
      update: typeof routes['establishment.establishment_rules.update']
    }
  }
}
