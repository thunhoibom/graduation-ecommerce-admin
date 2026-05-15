import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const userRoleService = createApiService(appApiIns, '/api/data/user_roles')

export type UserRolePojo = {
  id?: number
  name: string
}

export type PermissionPojo = {
  code: string
  description?: string | null
}

export type UserRoleWithPermissionsPojo = {
  id?: number
  name: string
  permissions: PermissionPojo[]
}

export type UserRoleSearchParams = {
  nameLike?: string
  pageIndex?: number
  pageSize?: number
}

export type PageResponse<T> = {
  items: T
  totalCount: number
  pageIndex: number
  pageSize: number
}

export const searchUserRoles = (params?: UserRoleSearchParams) => {
  return userRoleService.get<PageResponse<UserRolePojo[]>>('', { params })
}

export const listUserRolesWithPermissions = () => {
  return userRoleService.get<UserRoleWithPermissionsPojo[]>('/with_permissions')
}

export const createUserRole = (data: UserRolePojo) => {
  return userRoleService.post<void>('', data)
}

export const updateUserRole = (id: number, data: UserRolePojo) => {
  return userRoleService.put<void>(`/${id}`, data)
}

export const deleteUserRole = (id: number) => {
  return userRoleService.delete<void>(`/${id}`)
}
