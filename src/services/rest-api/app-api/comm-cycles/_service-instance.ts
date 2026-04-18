import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const commCyclesService = createApiService(appApiIns, '/api/v1/comm-cycles')
