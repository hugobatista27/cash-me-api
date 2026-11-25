import { test } from '@japa/runner'

test.group('Functional | Swagger Documentation', () => {
  test('should return openapi json spec including customer invoice and points routes', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/swagger')
    response.assertStatus(200)

    const text = response.text()
    console.log(
      'Is text YAML?',
      text.startsWith('openapi:') || text.includes('/api/v1/customer/invoices/process')
    )

    assert.include(text, '/api/v1/customer/invoices/process')
    assert.include(text, '/api/v1/customer/invoices')
    assert.include(text, '/api/v1/customer/balances')
    assert.include(text, '/api/v1/customer/establishments/{establishmentId}/statement')
    assert.include(text, '/api/v1/establishments')
    assert.include(text, '/api/v1/auth/establishment/register')
    assert.include(text, '/api/v1/establishments/{id}/address')
    assert.include(text, '/api/v1/establishments/{id}/approve')
    assert.include(text, '/api/v1/establishment/loyalty-rule')
    assert.include(text, '/api/v1/establishment/loyalty-rule/simulate')
    assert.include(text, '/api/v1/establishment/loyalty-rule/history')

    // Interface Swagger UI
    const uiResponse = await client.get('/docs')
    uiResponse.assertStatus(200)
    assert.include(uiResponse.text(), 'SwaggerUIBundle')
  })
})
