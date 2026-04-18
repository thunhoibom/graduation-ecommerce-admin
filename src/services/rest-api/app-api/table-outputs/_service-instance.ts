import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const tableOutputsService = createApiService(appApiIns, '/api/v1/table-outputs')
