import { sqlScriptTemplateService } from './_service-instance'

// Types
export type SqlScriptTemplate = {
  id: number
  code: string
  name: string
  script: string
  scriptType: string
  createdAt?: string
}

export type SqlScriptTemplateSearchParams = {
  code?: string
  name?: string
  scriptType?: string
  page?: number
  size?: number
}

// API Functions
export const getSqlScriptTemplates = async (
  params?: SqlScriptTemplateSearchParams
): Promise<{
  success: boolean
  data: SqlScriptTemplate[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}> => {
  return sqlScriptTemplateService.get('', { params })
}

export const getSqlScriptTemplatesByType = async (
  scriptType: string
): Promise<{
  success: boolean
  data: SqlScriptTemplate[]
}> => {
  return sqlScriptTemplateService.get('/by-type', { params: { scriptType } })
}

export const getSqlScriptTemplateById = async (
  id: number
): Promise<{
  success: boolean
  data: SqlScriptTemplate
}> => {
  return sqlScriptTemplateService.get(`/${id}`)
}