import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const authServiceInstance = createApiService(appApiIns, '/api/v1/auth')
