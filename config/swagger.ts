import path from 'node:path'
import url from 'node:url'
import app from '@adonisjs/core/services/app'

export default {
  path: path.dirname(url.fileURLToPath(import.meta.url)) + '/../',
  title: 'Cash-Me API',
  version: '1.0.0',
  description: 'Documentação da API Cash-Me',
  tagIndex: 3,
  ignore: ['/swagger', '/docs', '/'],
  preferredPutPatch: 'PUT',
  snakeCase: true,
  debug: app.inDev,
  common: {
    parameters: {},
    headers: {},
  },
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'OpaqueToken',
    },
  },
  authMiddlewares: ['auth'],
  defaultSecurityHeaders: [],
  persistAuthorization: true,
  showSummary: true,
}
