/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'auth.new_account.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').signupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').signupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.user_customers.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/customer/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user_customer').signupCustomerValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user_customer').signupCustomerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/user_customers_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/user_customers_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.user_establishments.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/establishment/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user_establishment').signupEstablishmentValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user_establishment').signupEstablishmentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/user_establishments_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/user_establishments_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.access_tokens.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.profile.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
    }
  }
  'profile.user_customers.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/customer/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/user_customers_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/user_customers_controller').default['show']>>>
    }
  }
  'profile.user_customers.update': {
    methods: ["PUT"]
    pattern: '/api/v1/account/customer/profile'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user_customer').updateCustomerValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user_customer').updateCustomerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/user_customers_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/user_customers_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.user_establishments.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/establishment/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/user_establishments_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/user_establishments_controller').default['show']>>>
    }
  }
  'profile.user_establishments.update': {
    methods: ["PUT"]
    pattern: '/api/v1/account/establishment/profile'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user_establishment').updateEstablishmentValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user_establishment').updateEstablishmentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/user_establishments_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/user_establishments_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.access_tokens.destroy': {
    methods: ["POST"]
    pattern: '/api/v1/account/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
    }
  }
  'customer.customer_invoices.process': {
    methods: ["POST"]
    pattern: '/api/v1/customer/invoices/process'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/invoice_validator').processInvoiceValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/invoice_validator').processInvoiceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer_invoices_controller').default['process']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer_invoices_controller').default['process']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customer.customer_invoices.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/customer/invoices'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer_invoices_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer_invoices_controller').default['index']>>>
    }
  }
  'customer.customer_invoices.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/customer/invoices/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer_invoices_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer_invoices_controller').default['show']>>>
    }
  }
  'customer.customer_points.balances': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/customer/balances'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer_points_controller').default['balances']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer_points_controller').default['balances']>>>
    }
  }
  'customer.customer_points.statement': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/customer/establishments/:establishmentId/statement'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { establishmentId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customer_points_controller').default['statement']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customer_points_controller').default['statement']>>>
    }
  }
  'establishments.establishments.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/establishments'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/establishments_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/establishments_controller').default['index']>>>
    }
  }
  'establishments.establishments.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/establishments/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/establishments_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/establishments_controller').default['show']>>>
    }
  }
  'establishments.establishments.store': {
    methods: ["POST"]
    pattern: '/api/v1/establishments'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/establishment_validator').createEstablishmentValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/establishment_validator').createEstablishmentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/establishments_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/establishments_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'establishments.establishments.update': {
    methods: ["PUT"]
    pattern: '/api/v1/establishments/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/establishment_validator').updateEstablishmentValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/establishment_validator').updateEstablishmentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/establishments_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/establishments_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}
