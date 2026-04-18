import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const payeeTypesService = createApiService(appApiIns, '/api/v1/payee-types')
