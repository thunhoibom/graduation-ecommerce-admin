import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const transactionsService = createApiService(appApiIns, '/api/v1/transactions')
