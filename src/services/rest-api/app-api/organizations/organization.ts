import { organizationsService } from './_service-instance'

export type OrganizationNode = {
  organizationCode: string
  organizationName: string
  parentCode?: string | null
  children?: OrganizationNode[]
}

export type OrganizationTreeResponse = {
  success: boolean
  message?: string
  data: OrganizationNode[]
  timestamp?: string
}

export const getOrganizationTree = () => {
  return organizationsService.get<OrganizationTreeResponse>('/api/v1/organizations/tree')
}

