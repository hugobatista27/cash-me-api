import { test } from '@japa/runner'
import PointsEngineService from '#services/points_engine_service'
import PointRule from '#models/point_rule'

test.group('Unit | Loyalty Rule Engine', () => {
  test('computePointsFromRule should apply base amount and points per base', ({ assert }) => {
    const service = new PointsEngineService()

    // Regra R$ 10,00 = 1 ponto
    const rule = {
      baseAmount: 10.0,
      pointsPerBase: 1,
      minPurchaseAmount: 0.0,
    }

    assert.equal(service.computePointsFromRule(100.0, rule), 10)
    assert.equal(service.computePointsFromRule(99.9, rule), 9)
    assert.equal(service.computePointsFromRule(9.99, rule), 0)
    assert.equal(service.computePointsFromRule(10.0, rule), 1)

    // Regra R$ 5,00 = 2 pontos
    const rule2 = {
      baseAmount: 5.0,
      pointsPerBase: 2,
      minPurchaseAmount: 0.0,
    }

    assert.equal(service.computePointsFromRule(25.0, rule2), 10)
    assert.equal(service.computePointsFromRule(24.0, rule2), 8)
  })

  test('computePointsFromRule should respect minPurchaseAmount', ({ assert }) => {
    const service = new PointsEngineService()

    const rule = {
      baseAmount: 1.0,
      pointsPerBase: 1,
      minPurchaseAmount: 50.0,
    }

    // Compra abaixo do mínimo
    assert.equal(service.computePointsFromRule(49.99, rule), 0)

    // Compra que atinge ou supera o mínimo
    assert.equal(service.computePointsFromRule(50.0, rule), 50)
    assert.equal(service.computePointsFromRule(75.5, rule), 75)
  })

  test('computePointsFromRule should respect maxPointsPerPurchase ceiling', ({ assert }) => {
    const service = new PointsEngineService()

    const rule = {
      baseAmount: 1.0,
      pointsPerBase: 1,
      minPurchaseAmount: 0.0,
      maxPointsPerPurchase: 100,
    }

    assert.equal(service.computePointsFromRule(50.0, rule), 50)
    assert.equal(service.computePointsFromRule(100.0, rule), 100)
    assert.equal(service.computePointsFromRule(500.0, rule), 100)
  })

  test('PointRule should format humanReadableSummary properly', ({ assert }) => {
    const rule1 = new PointRule()
    rule1.baseAmount = 10.0
    rule1.pointsPerBase = 1
    rule1.minPurchaseAmount = 0.0
    rule1.maxPointsPerPurchase = null

    assert.equal(rule1.humanReadableSummary, 'A cada R$ 10,00, você ganha 1 ponto.')

    const rule2 = new PointRule()
    rule2.baseAmount = 5.0
    rule2.pointsPerBase = 3
    rule2.minPurchaseAmount = 30.0
    rule2.maxPointsPerPurchase = 150

    assert.equal(
      rule2.humanReadableSummary,
      'A cada R$ 5,00, você ganha 3 pontos (compra mínima de R$ 30,00) (máximo de 150 pontos por compra).'
    )
  })
})
