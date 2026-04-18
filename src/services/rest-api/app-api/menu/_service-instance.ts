import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const menuService = createApiService(appApiIns, '/api/v1/auth/menu')
