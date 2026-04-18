import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const transTypeDefinitionsService = createApiService(
  appApiIns,
  '/api/v1/trans-type-definitions',
)
