import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const apDomainService = createApiService(appApiIns, '/api/v1/ap-domain')
