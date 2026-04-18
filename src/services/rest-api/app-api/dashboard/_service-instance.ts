import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const dashboardService = createApiService(appApiIns, '/api/admin/dashboard')
