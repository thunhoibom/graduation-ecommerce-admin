import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const payeeManagersService = createApiService(appApiIns, '/api/v1/payee-managers')
