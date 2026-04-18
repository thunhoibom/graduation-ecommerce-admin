import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const commSystemsService = createApiService(
  appApiIns,
  '/api/v1/systems',
)
