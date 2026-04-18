import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const profilesService = createApiService(appApiIns, '/api/v1/profiles')

