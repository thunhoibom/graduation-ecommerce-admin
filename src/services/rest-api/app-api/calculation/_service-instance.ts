import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const calculationService = createApiService(appApiIns, '/api/v1/calculation')

