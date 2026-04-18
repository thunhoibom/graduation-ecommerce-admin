import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const commissionApprovalsService = createApiService(
  appApiIns,
  '/api/v1/commission-approvals',
)
