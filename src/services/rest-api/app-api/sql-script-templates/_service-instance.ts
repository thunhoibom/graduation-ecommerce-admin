import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const sqlScriptTemplateService = createApiService(
  appApiIns,
  '/api/v1/sql-script-templates'
)
