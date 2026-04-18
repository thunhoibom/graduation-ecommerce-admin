import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const inputDefsService = createApiService(appApiIns, '/api/v1/input-defs')
