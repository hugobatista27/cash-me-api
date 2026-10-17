import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import User from '#models/user'
import UserCustomer from '#models/user_customer'
import UserEstablishment from '#models/user_establishment'
import Establishment from '#models/establishment'
import EstablishmentAddress from '#models/establishment_address'
import LoyaltyProgram from '#models/loyalty_program'
import PointRule from '#models/point_rule'
import PointBalance from '#models/point_balance'
import PointTransaction from '#models/point_transaction'
import PointsEngineService from '#services/points_engine_service'

export default class DatabaseSeeder extends BaseSeeder {
  async run() {
    console.log('\n======================================================')
    console.log('🚀 Iniciando Database Seeder do Cash-Me...')
    console.log('======================================================\n')

    // 0. Limpeza prévia para garantir idempotência em caso de reexecução
    await db.rawQuery('PRAGMA foreign_keys = OFF;')
    await db.from('invoice_items').delete()
    await db.from('point_transactions').delete()
    await db.from('invoices').delete()
    await db.from('point_balances').delete()
    await db.from('point_rules').delete()
    await db.from('loyalty_programs').delete()
    await db.from('establishment_addresses').delete()
    await db.from('user_establishments').delete()
    await db.from('user_customers').delete()
    await db.from('establishments').delete()
    await db.from('auth_access_tokens').delete()
    await db.from('users').delete()
    await db.rawQuery('PRAGMA foreign_keys = ON;')

    console.log('🧹 Base de dados limpa com sucesso.')

    // =========================================================================
    // 1. CRIAÇÃO DE ESTABELECIMENTOS E SEUS RESPECTIVOS PERFIS E ENDEREÇOS
    // =========================================================================

    // Estabelecimento 1: Supermercado em Santa Catarina (SC) - ATIVO
    const establishmentSC = await Establishment.create({
      cnpj: '12345678000195',
      legalName: 'Supermercado Progresso Ltda',
      tradeName: 'Supermercado Progresso',
      status: 'ACTIVE',
      conversionFactor: 1.0,
      phone: '4833214567',
      whatsapp: '48991234567',
      email: 'contato@supermercadoprogresso.com.br',
      website: 'https://supermercadoprogresso.com.br',
      instagram: '@supermercadoprogresso',
      socialLinks: {
        facebook: 'https://facebook.com/supermercadoprogresso',
      },
    })

    await EstablishmentAddress.create({
      establishmentId: establishmentSC.id,
      postalCode: '88010000',
      state: 'SC',
      city: 'Florianópolis',
      neighborhood: 'Centro',
      street: 'Rua das Flores',
      number: '120',
      complement: 'Bloco A',
      reference: 'Ao lado da Praça XV',
      latitude: -27.5954,
      longitude: -48.5480,
    })

    // Usuário Lojista Admin do Estabelecimento 1
    const userLojistaSC = await User.create({
      email: 'lojista@supermercadoprogresso.com.br',
      password: 'password123',
      userType: 'ESTABLISHMENT',
      status: 'ACTIVE',
      lastLoginAt: DateTime.now().minus({ days: 1 }),
    })

    await UserEstablishment.create({
      userId: userLojistaSC.id,
      establishmentId: establishmentSC.id,
      fullName: 'Carlos Eduardo da Silva',
      role: 'LOJISTA_ADMIN',
    })

    // Usuário Operador / Caixa do Estabelecimento 1
    const userOperadorSC = await User.create({
      email: 'operador@supermercadoprogresso.com.br',
      password: 'password123',
      userType: 'ESTABLISHMENT',
      status: 'ACTIVE',
      lastLoginAt: DateTime.now().minus({ hours: 4 }),
    })

    await UserEstablishment.create({
      userId: userOperadorSC.id,
      establishmentId: establishmentSC.id,
      fullName: 'Fernanda Santos Oliveira',
      role: 'OPERADOR',
    })

    // Programa de Fidelidade e Regras de Pontuação do Estabelecimento 1
    const programSC = await LoyaltyProgram.create({
      establishmentId: establishmentSC.id,
      name: 'Clube Fidelidade Progresso',
      status: 'ACTIVE',
      pointsCurrency: 'pontos',
    })

    // Regra v1: Histórica / Inativa
    await PointRule.create({
      loyaltyProgramId: programSC.id,
      establishmentId: establishmentSC.id,
      createdBy: userLojistaSC.id,
      version: 1,
      name: 'Regra Inaugural: R$ 1,00 = 1 Ponto',
      status: 'INACTIVE',
      baseAmount: 1.0,
      pointsPerBase: 1,
      minPurchaseAmount: 0.0,
      maxPointsPerPurchase: 500,
    })

    // Regra v2: Ativa com bônus (A cada R$ 2,00 ganhe 3 Pontos, compra mínima R$ 10,00)
    await PointRule.create({
      loyaltyProgramId: programSC.id,
      establishmentId: establishmentSC.id,
      createdBy: userLojistaSC.id,
      version: 2,
      name: 'Regra Fidelidade Turbo: R$ 2,00 = 3 Pontos',
      status: 'ACTIVE',
      baseAmount: 2.0,
      pointsPerBase: 3,
      minPurchaseAmount: 10.0,
      maxPointsPerPurchase: 1000,
    })

    console.log('✅ Estabelecimento 1 (Supermercado Progresso - SC) criado com sucesso.')

    // Estabelecimento 2: Café & Bistrô no Paraná (PR) - ATIVO
    const establishmentPR = await Establishment.create({
      cnpj: '98765432000188',
      legalName: 'Café & Bistrô Curitiba Ltda',
      tradeName: 'Café & Bistrô Curitiba',
      status: 'ACTIVE',
      conversionFactor: 1.0,
      phone: '4133456789',
      whatsapp: '41988776655',
      email: 'contato@cafebistrocuritiba.com.br',
      website: 'https://cafebistrocuritiba.com.br',
      instagram: '@cafebistrocuritiba',
      socialLinks: {},
    })

    await EstablishmentAddress.create({
      establishmentId: establishmentPR.id,
      postalCode: '80420000',
      state: 'PR',
      city: 'Curitiba',
      neighborhood: 'Batel',
      street: 'Avenida do Batel',
      number: '1500',
      complement: 'Loja 4',
      reference: 'Próximo ao Shopping Pátio Batel',
      latitude: -25.4428,
      longitude: -49.2882,
    })

    const userLojistaPR = await User.create({
      email: 'contato@cafebistrocuritiba.com.br',
      password: 'password123',
      userType: 'ESTABLISHMENT',
      status: 'ACTIVE',
      lastLoginAt: DateTime.now().minus({ days: 2 }),
    })

    await UserEstablishment.create({
      userId: userLojistaPR.id,
      establishmentId: establishmentPR.id,
      fullName: 'Roberto Albuquerque',
      role: 'LOJISTA_ADMIN',
    })

    const programPR = await LoyaltyProgram.create({
      establishmentId: establishmentPR.id,
      name: 'Clube Café Gourmet',
      status: 'ACTIVE',
      pointsCurrency: 'pontos',
    })

    // Regra Ativa do Estabelecimento 2: R$ 5,00 = 2 Pontos
    await PointRule.create({
      loyaltyProgramId: programPR.id,
      establishmentId: establishmentPR.id,
      createdBy: userLojistaPR.id,
      version: 1,
      name: 'Clube Café Gourmet: R$ 5,00 = 2 Pontos',
      status: 'ACTIVE',
      baseAmount: 5.0,
      pointsPerBase: 2,
      minPurchaseAmount: 5.0,
      maxPointsPerPurchase: 300,
    })

    console.log('✅ Estabelecimento 2 (Café & Bistrô Curitiba - PR) criado com sucesso.')

    // Estabelecimento 3: Padaria em Joinville (SC) - PENDENTE (para demonstrar onboarding)
    const establishmentPending = await Establishment.create({
      cnpj: '11222333000144',
      legalName: 'Padaria & Confeitaria Joinville Ltda',
      tradeName: 'Padaria Joinville',
      status: 'PENDING',
      conversionFactor: 1.0,
      phone: '4734332211',
      whatsapp: '47999887766',
      email: 'contato@padariajoinville.com.br',
    })

    await EstablishmentAddress.create({
      establishmentId: establishmentPending.id,
      postalCode: '89201000',
      state: 'SC',
      city: 'Joinville',
      neighborhood: 'América',
      street: 'Rua das Palmeiras',
      number: '45',
      latitude: -26.3045,
      longitude: -48.8487,
    })

    const userPending = await User.create({
      email: 'contato@padariajoinville.com.br',
      password: 'password123',
      userType: 'ESTABLISHMENT',
      status: 'ACTIVE',
    })

    await UserEstablishment.create({
      userId: userPending.id,
      establishmentId: establishmentPending.id,
      fullName: 'Marcos Vinícius Pereira',
      role: 'LOJISTA_ADMIN',
    })

    console.log('✅ Estabelecimento 3 (Padaria Joinville - PENDING) criado com sucesso.')

    // =========================================================================
    // 2. CRIAÇÃO DE CONSUMIDORES (CUSTOMERS)
    // =========================================================================

    // Consumidor 1: Maria Oliveira da Silva
    const userCustomer1 = await User.create({
      email: 'maria.silva@email.com',
      password: 'password123',
      userType: 'CUSTOMER',
      status: 'ACTIVE',
      lastLoginAt: DateTime.now().minus({ hours: 1 }),
    })

    const customer1 = await UserCustomer.create({
      userId: userCustomer1.id,
      fullName: 'Maria Oliveira da Silva',
      cpf: '12345678901',
      phone: '48998765432',
      authProvider: 'LOCAL',
      termsAcceptedAt: DateTime.now().minus({ days: 30 }),
      deviceToken: 'fcm_token_maria_demo_123',
    })

    // Consumidor 2: João Pedro dos Santos
    const userCustomer2 = await User.create({
      email: 'joao.santos@email.com',
      password: 'password123',
      userType: 'CUSTOMER',
      status: 'ACTIVE',
      lastLoginAt: DateTime.now().minus({ hours: 6 }),
    })

    const customer2 = await UserCustomer.create({
      userId: userCustomer2.id,
      fullName: 'João Pedro dos Santos',
      cpf: '98765432100',
      phone: '41987654321',
      authProvider: 'LOCAL',
      termsAcceptedAt: DateTime.now().minus({ days: 15 }),
      deviceToken: 'fcm_token_joao_demo_456',
    })

    console.log('✅ Consumidores (Maria Silva e João Santos) criados com sucesso.')

    // =========================================================================
    // 3. EMULAÇÃO: PROCESSAMENTO DE NOTAS FISCAIS E CÔMPUTO DE PONTOS
    // =========================================================================
    const pointsEngine = new PointsEngineService()

    // Cenário 3.1: Compra Recente no Supermercado Progresso (Maria Silva)
    // Total: R$ 154,50 -> Regra Ativa: R$ 2,00 = 3 pts -> Math.floor(154.50 / 2) * 3 = 77 * 3 = 231 pontos
    const invoiceResult1 = await pointsEngine.processInvoice(customer1, {
      accessKey: '42261012345678000195650010000001231000001234',
      qrCodeUrl:
        'https://sat.sef.sc.gov.br/nfce/qrcode?p=42261012345678000195650010000001231000001234|2|1|1|D8A58A7F416D4AE7923',
      issuerState: 'SC',
      issuerCnpj: establishmentSC.cnpj,
      issuedAt: DateTime.now().minus({ hours: 2 }),
      totalAmount: 154.50,
      items: [
        {
          rawDescription: 'Arroz Tipo 1 5kg',
          quantity: 1,
          unitPrice: 28.50,
          totalPrice: 28.50,
        },
        {
          rawDescription: 'Feijão Preto 1kg',
          quantity: 2,
          unitPrice: 8.50,
          totalPrice: 17.00,
        },
        {
          rawDescription: 'Azeite de Oliva Extra Virgem 500ml',
          quantity: 1,
          unitPrice: 42.00,
          totalPrice: 42.00,
        },
        {
          rawDescription: 'Café Torrado e Moído 500g',
          quantity: 2,
          unitPrice: 18.50,
          totalPrice: 37.00,
        },
        {
          rawDescription: 'Leite Integral 1L',
          quantity: 5,
          unitPrice: 6.00,
          totalPrice: 30.00,
        },
      ],
    })

    console.log(
      `🛒 Compra 1 processada: Maria ganhou ${invoiceResult1.pointsAwarded} pontos no ${establishmentSC.tradeName}.`
    )

    // Cenário 3.2: Segunda Compra no Supermercado Progresso (Maria Silva)
    // Total: R$ 86,00 -> Regra Ativa: R$ 2,00 = 3 pts -> Math.floor(86.00 / 2) * 3 = 43 * 3 = 129 pontos
    // Saldo acumulado vai para: 231 + 129 = 360 pontos!
    const invoiceResult2 = await pointsEngine.processInvoice(customer1, {
      accessKey: '42261012345678000195650010000001241000005678',
      qrCodeUrl:
        'https://sat.sef.sc.gov.br/nfce/qrcode?p=42261012345678000195650010000001241000005678|2|1|1|F7B28C3E527D',
      issuerState: 'SC',
      issuerCnpj: establishmentSC.cnpj,
      issuedAt: DateTime.now().minus({ hours: 18 }),
      totalAmount: 86.00,
      items: [
        {
          rawDescription: 'Pão Francês Tradicional Kg',
          quantity: 1,
          unitPrice: 16.00,
          totalPrice: 16.00,
        },
        {
          rawDescription: 'Queijo Muçarela Fatiado 500g',
          quantity: 1,
          unitPrice: 32.00,
          totalPrice: 32.00,
        },
        {
          rawDescription: 'Presunto Cozido Especial 400g',
          quantity: 1,
          unitPrice: 18.00,
          totalPrice: 18.00,
        },
        {
          rawDescription: 'Iogurte Natural 170g',
          quantity: 4,
          unitPrice: 5.00,
          totalPrice: 20.00,
        },
      ],
    })

    console.log(
      `🛒 Compra 2 processada: Maria ganhou +${invoiceResult2.pointsAwarded} pontos no ${establishmentSC.tradeName}.`
    )

    // Cenário 3.3: Compra no Café & Bistrô Curitiba (PR) pela Maria Silva (Multi-Tenant Balance)
    // Total: R$ 42,00 -> Regra Café: R$ 5,00 = 2 pts -> Math.floor(42.00 / 5) * 2 = 8 * 2 = 16 pontos
    const invoiceResult3 = await pointsEngine.processInvoice(customer1, {
      accessKey: '41261098765432000188650020000002021000008888',
      qrCodeUrl:
        'https://fazenda.pr.gov.br/nfce/qrcode?p=41261098765432000188650020000002021000008888|2|1|1|A39D83',
      issuerState: 'PR',
      issuerCnpj: establishmentPR.cnpj,
      issuedAt: DateTime.now().minus({ hours: 8 }),
      totalAmount: 42.00,
      items: [
        {
          rawDescription: 'Cappuccino Italiano Grande',
          quantity: 1,
          unitPrice: 18.00,
          totalPrice: 18.00,
        },
        {
          rawDescription: 'Sanduíche Ciabatta com Presunto Parma',
          quantity: 1,
          unitPrice: 24.00,
          totalPrice: 24.00,
        },
      ],
    })

    console.log(
      `☕ Compra 3 processada: Maria ganhou ${invoiceResult3.pointsAwarded} pontos no ${establishmentPR.tradeName}.`
    )

    // Cenário 3.4: Compra do João Santos no Café & Bistrô Curitiba (PR)
    // Total: R$ 75,00 -> Regra Café: R$ 5,00 = 2 pts -> Math.floor(75.00 / 5) * 2 = 15 * 2 = 30 pontos
    const invoiceResult4 = await pointsEngine.processInvoice(customer2, {
      accessKey: '41261098765432000188650020000002011000009999',
      qrCodeUrl:
        'https://fazenda.pr.gov.br/nfce/qrcode?p=41261098765432000188650020000002011000009999|2|1|1|C8912E',
      issuerState: 'PR',
      issuerCnpj: establishmentPR.cnpj,
      issuedAt: DateTime.now().minus({ hours: 5 }),
      totalAmount: 75.00,
      items: [
        {
          rawDescription: 'Café Espresso Duplo Gourmet',
          quantity: 2,
          unitPrice: 12.50,
          totalPrice: 25.00,
        },
        {
          rawDescription: 'Croissant Francês com Manteiga',
          quantity: 2,
          unitPrice: 16.00,
          totalPrice: 32.00,
        },
        {
          rawDescription: 'Fatia Torta Banoffee Artesanal',
          quantity: 1,
          unitPrice: 18.00,
          totalPrice: 18.00,
        },
      ],
    })

    console.log(
      `☕ Compra 4 processada: João ganhou ${invoiceResult4.pointsAwarded} pontos no ${establishmentPR.tradeName}.`
    )

    // Cenário 3.5: Nota Fiscal Rejeitada (> 48h de emissão - RN01) para testar exibição de rejeição
    const invoiceResult5 = await pointsEngine.processInvoice(customer1, {
      accessKey: '42261012345678000195650010000000991000007777',
      qrCodeUrl:
        'https://sat.sef.sc.gov.br/nfce/qrcode?p=42261012345678000195650010000000991000007777|2|1|1|EXPIRED',
      issuerState: 'SC',
      issuerCnpj: establishmentSC.cnpj,
      issuedAt: DateTime.now().minus({ days: 4 }), // 4 dias atrás -> > 48h
      totalAmount: 120.00,
    })

    console.log(
      `⚠️  Nota Rejeitada de Teste: Status=${invoiceResult5.status}, Motivo=${invoiceResult5.rejectionReason}`
    )

    // =========================================================================
    // 4. EMULAÇÃO: RESGATE / DÉBITO DE PONTOS NO LEDGER (CICLO COMPLETO)
    // =========================================================================
    // Maria Silva resgata 50 pontos por um cupom de desconto no Supermercado Progresso
    const pointsToRedeem = 50
    const balanceMariaSC = await PointBalance.query()
      .where('customerId', customer1.id)
      .where('establishmentId', establishmentSC.id)
      .firstOrFail()

    balanceMariaSC.currentBalance = Number(balanceMariaSC.currentBalance) - pointsToRedeem
    await balanceMariaSC.save()

    await PointTransaction.create({
      customerId: customer1.id,
      establishmentId: establishmentSC.id,
      invoiceId: null,
      ruleId: null,
      ruleVersion: null,
      type: 'DEBIT',
      points: -pointsToRedeem,
      purchaseAmount: null,
      appliedConversionFactor: null,
      description: 'Resgate de Cupom de R$ 10 de Desconto no Caixa',
      metadata: {
        rewardTitle: 'Cupom R$ 10 OFF',
        redeemedAt: DateTime.now().toISO(),
        couponCode: 'PROG-DESC-10',
      },
    })

    console.log(
      `🎁 Resgate emulado: Maria resgatou ${pointsToRedeem} pontos no ${establishmentSC.tradeName}. Saldo atual: ${balanceMariaSC.currentBalance} pts.`
    )

    // =========================================================================
    // 5. RESUMO CONSOLIDADO PARA O DESENVOLVEDOR / TESTES
    // =========================================================================
    console.log('\n======================================================')
    console.log('🎉 SEED CONCLUÍDO COM SUCESSO! CREDENCIAIS DE ACESSO:')
    console.log('======================================================')
    console.log('👨‍💼 Lojista Admin (SC - Ativo):')
    console.log('   Email: lojista@supermercadoprogresso.com.br')
    console.log('   Senha: password123')
    console.log('   Loja: Supermercado Progresso (CNPJ: 12345678000195)')
    console.log('   Regra: R$ 2,00 = 3 Pontos (compra mín. R$ 10,00)')
    console.log('------------------------------------------------------')
    console.log('🧑‍💻 Lojista Operador (SC - Caixa):')
    console.log('   Email: operador@supermercadoprogresso.com.br')
    console.log('   Senha: password123')
    console.log('------------------------------------------------------')
    console.log('👨‍💼 Lojista Admin (PR - Ativo):')
    console.log('   Email: contato@cafebistrocuritiba.com.br')
    console.log('   Senha: password123')
    console.log('   Loja: Café & Bistrô Curitiba (CNPJ: 98765432000188)')
    console.log('   Regra: R$ 5,00 = 2 Pontos')
    console.log('------------------------------------------------------')
    console.log('🏢 Lojista Pendente (SC - Onboarding):')
    console.log('   Email: contato@padariajoinville.com.br')
    console.log('   Senha: password123')
    console.log('   Loja: Padaria Joinville (Status: PENDING)')
    console.log('------------------------------------------------------')
    console.log('👩 Consumidora Principal (Maria Silva):')
    console.log('   Email: maria.silva@email.com')
    console.log('   Senha: password123')
    console.log('   CPF: 12345678901')
    console.log('   Saldo Supermercado Progresso: 310 pontos (360 acumulados - 50 resgatados)')
    console.log('   Saldo Café & Bistrô Curitiba: 16 pontos')
    console.log('   Notas Fiscais: 2 Aprovadas + 1 Rejeitada (>48h)')
    console.log('------------------------------------------------------')
    console.log('👨 Consumidor Secundário (João Santos):')
    console.log('   Email: joao.santos@email.com')
    console.log('   Senha: password123')
    console.log('   CPF: 98765432100')
    console.log('   Saldo Café & Bistrô Curitiba: 30 pontos')
    console.log('======================================================\n')
  }
}