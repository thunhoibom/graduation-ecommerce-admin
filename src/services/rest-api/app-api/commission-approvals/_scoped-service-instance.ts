import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const commissionScopedService = createApiService(
  appApiIns,
  '/api/v1/commission-approvals/scoped',
)