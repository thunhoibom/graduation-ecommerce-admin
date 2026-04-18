import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const incentivesService = createApiService(appApiIns, '/api/v1/incentives')
