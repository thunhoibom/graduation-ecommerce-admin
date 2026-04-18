import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

export const paymentRequestsService = createApiService(appApiIns, '/api/v1/payment-requests')
