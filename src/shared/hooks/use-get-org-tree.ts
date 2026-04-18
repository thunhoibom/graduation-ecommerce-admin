import { SWR_KEYS } from '@/constants/swrKeys'
import { useAxiosSWR } from './use-axios-swr'
import {
  getOrganizationTree,
  type OrganizationNode,
} from '@/services/rest-api/app-api/organizations/organization'

export const useGetOrgTree = () => {
  const { data, isLoading, isInitializing, isValidating, mutate, error } =
    useAxiosSWR<OrganizationNode[]>(
      [SWR_KEYS.ORG_TREE],
      async () => {
        const res = await getOrganizationTree()
        // Axios interceptor đã trả về OrganizationTreeResponse
        // nên lấy mảng data bên trong
        return res.data
      },
      {
        revalidateWhenUndefined: true,
      },
    )

  return {
    tree: (data as OrganizationNode[]) ?? [],
    isLoading,
    isInitializing,
    isValidating,
    mutate,
    error,
  }
}

