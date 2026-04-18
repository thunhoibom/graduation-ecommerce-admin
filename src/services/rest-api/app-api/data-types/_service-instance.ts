import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const dataTypesService = createApiService(
  appApiIns,
  '/api/v1/data-types',
)
