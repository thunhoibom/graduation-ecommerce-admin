import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const incentiveGroupsService = createApiService(appApiIns, '/api/v1/incentive-groups')
