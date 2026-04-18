import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const payeesService = createApiService(appApiIns, '/api/v1/payees')
