import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const servicesService = createApiService(appApiIns, '/api/v1/services')
