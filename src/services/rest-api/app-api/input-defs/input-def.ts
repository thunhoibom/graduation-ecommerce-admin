import { inputDefsService } from './_service-instance'

// Types
export type InputDefVariable = {
  id: number
  createdDateTime?: string
  code: string
  name: string
  elementType?: string
  /** JDBC type name (e.g. VARCHAR, TIMESTAMP) */
  dataType?: string
  defaultValue?: string
  format?: string
  script?: string
  payOn?: number
  factor?: number
  aggregation?: number
  serviceId?: number
  bindingLabel?: string
  bindingValue?: string
  varType?: number
  status?: number
}

export type InputDef = {
  id: number
  code: string
  name: string
  transTypeCode?: string
  queryType: number
  status: number
  description?: string
  script?: string
  sqlScriptId?: number
  createdDateTime?: string
  variables?: InputDefVariable[]
}

export type InputDefVariableUpsertRequest = {
  id?: number
  code: string
  name: string
  elementType?: string
  dataType: string
  defaultValue?: string
  format?: string
  script?: string
  payOn?: number
  factor?: number
  aggregation?: number
  serviceId?: number
  bindingLabel?: string
  bindingValue?: string
  varType: number
  status: number
}

export type InputDefRequest = {
  code: string
  name: string
  transTypeCode?: string
  queryType: number
  status: number
  description?: string
  sqlScriptId?: number
  customVariables?: InputDefVariableUpsertRequest[]
}

export type InputDefSearchParams = {
  code?: string
  name?: string
  transTypeCode?: string
  status?: number
  queryType?: number
  page?: number
  size?: number
}

export type PageResponse<T> = {
  success: boolean
  message?: string
  data: T
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export type BaseResponse<T> = {
  success: boolean
  message?: string
  data: T
  timestamp?: string
}

// API Functions
export const getInputDefs = async (
  params?: InputDefSearchParams,
): Promise<PageResponse<InputDef[]>> => {
  return inputDefsService.get<PageResponse<InputDef[]>>('', { params })
}

export const getInputDefById = async (id: number): Promise<BaseResponse<InputDef>> => {
  return inputDefsService.get<BaseResponse<InputDef>>(`/${id}`)
}

export const createInputDef = async (
  data: InputDefRequest,
): Promise<BaseResponse<InputDef>> => {
  return inputDefsService.post<BaseResponse<InputDef>>('', data)
}

export const updateInputDef = async (
  id: number,
  data: InputDefRequest,
): Promise<BaseResponse<InputDef>> => {
  return inputDefsService.put<BaseResponse<InputDef>>(`/${id}`, data)
}

export const deleteInputDef = async (id: number): Promise<BaseResponse<void>> => {
  return inputDefsService.delete<BaseResponse<void>>(`/${id}`)
}

export const getInputDefVariables = async (
  id: number,
): Promise<BaseResponse<InputDefVariable[]>> => {
  return inputDefsService.get<BaseResponse<InputDefVariable[]>>(`/${id}/variables`)
}

export const upsertInputDefVariables = async (
  id: number,
  data: InputDefVariableUpsertRequest[],
): Promise<BaseResponse<InputDefVariable[]>> => {
  return inputDefsService.put<BaseResponse<InputDefVariable[]>>(`/${id}/variables`, data)
}

export const addInputDefVariable = async (
  id: number,
  data: InputDefVariableUpsertRequest,
): Promise<BaseResponse<InputDefVariable>> => {
  return inputDefsService.post<BaseResponse<InputDefVariable>>(`/${id}/variables`, data)
}

export const updateInputDefVariable = async (
  id: number,
  varId: number,
  data: InputDefVariableUpsertRequest,
): Promise<BaseResponse<InputDefVariable>> => {
  return inputDefsService.put<BaseResponse<InputDefVariable>>(`/${id}/variables/${varId}`, data)
}

export const deleteInputDefVariable = async (
  id: number,
  varId: number,
): Promise<BaseResponse<void>> => {
  return inputDefsService.delete<BaseResponse<void>>(`/${id}/variables/${varId}`)
}

// --- Output mapping (Mapping đầu ra) ---
export type InputOutputMapItem = {
  id: number
  tableOutId: number
  tableName: string
  tableDescription?: string
  status?: number
  /** created_datetime in DB */
  createdDateTime?: string
}

export type FieldMappingItem = {
  tbOutputFieldId: number
  fieldCode: string
  fieldName: string
  inputDefVarId?: number | null
}

export type SaveFieldMappingsPayload = {
  mappings: Array<{ tbOutputFieldId: number; inputDefVarId: number | null }>
}

// --- Verify script ---
export type VerifyScriptRequest = {
  sqlScriptId?: number
  queryType: number
  id?: number
  customVariables?: InputDefVariableUpsertRequest[]
}

export type VerifyScriptResponse = {
  success: boolean
  message: string
}

export const verifyScript = async (
  data: VerifyScriptRequest,
): Promise<BaseResponse<VerifyScriptResponse>> => {
  return inputDefsService.post<BaseResponse<VerifyScriptResponse>>('/verify', data)
}

export const syncScript = async (
  id: number,
): Promise<BaseResponse<InputDef>> => {
  return inputDefsService.post<BaseResponse<InputDef>>(`/${id}/sync-script`, {})
}

export const getOutputMaps = async (
  inputDefId: number,
): Promise<BaseResponse<InputOutputMapItem[]>> => {
  return inputDefsService.get<BaseResponse<InputOutputMapItem[]>>(`/${inputDefId}/output-maps`)
}

export const addOutputMap = async (
  inputDefId: number,
  tableOutId: number,
): Promise<BaseResponse<InputOutputMapItem>> => {
  return inputDefsService.post<BaseResponse<InputOutputMapItem>>(`/${inputDefId}/output-maps`, {
    tableOutId,
  })
}

export const deleteOutputMap = async (
  inputDefId: number,
  mapId: number,
): Promise<BaseResponse<void>> => {
  return inputDefsService.delete<BaseResponse<void>>(`/${inputDefId}/output-maps/${mapId}`)
}

export const getFieldMappings = async (
  inputDefId: number,
  mapId: number,
): Promise<BaseResponse<FieldMappingItem[]>> => {
  return inputDefsService.get<BaseResponse<FieldMappingItem[]>>(
    `/${inputDefId}/output-maps/${mapId}/field-mappings`,
  )
}

export const saveFieldMappings = async (
  inputDefId: number,
  mapId: number,
  payload: SaveFieldMappingsPayload,
): Promise<BaseResponse<void>> => {
  return inputDefsService.put<BaseResponse<void>>(
    `/${inputDefId}/output-maps/${mapId}/field-mappings`,
    payload,
  )
}
