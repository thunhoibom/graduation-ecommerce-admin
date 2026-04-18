import { BaseApi } from '@/shared/utils/axios'
import { AxiosInstance } from 'axios'
//

export const createApiService = (axiosIns: AxiosInstance, servicePath: string) =>
  new BaseApi(axiosIns, servicePath)
