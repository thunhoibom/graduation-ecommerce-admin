import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const plansService = createApiService(appApiIns, '/api/v1/plans')
