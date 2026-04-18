import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const controlTypesService = createApiService(
    appApiIns,
    '/api/v1/control-types',
)
