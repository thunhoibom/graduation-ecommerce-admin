import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const userService = createApiService(appApiIns, '/api/data/users')

export type PersonPojo = {
  id?: number
  firstName?: string
  lastName?: string
  email: string
  phone1?: string
  phone2?: string
  idNumber?: string
}

export type UserPojo = {
  id?: number
  name: string
  password?: string
  role?: string
  person?: PersonPojo
}

export type UserSearchParams = {
  nameLike?: string
  emailLike?: string
  role?: string
  pageIndex?: number
  pageSize?: number
  sortBy?: string
  order?: 'asc' | 'desc'
}

export type PageResponse<T> = {
  items: T
  totalCount: number
  pageIndex: number
  pageSize: number
}

export const searchUsers = (params?: UserSearchParams) => {
  return userService.get<PageResponse<UserPojo[]>>('', { params })
}

export const getUserById = (id: number) => {
  return userService.get<UserPojo>(`/${id}`)
}

export const createUser = (data: UserPojo) => {
  return userService.post<void>('', data)
}

export const updateUser = (id: number, data: UserPojo) => {
  return userService.put<void>(`/${id}`, data)
}

export const patchUser = (id: number, body: Record<string, unknown>) => {
  return userService.patch<void>(`/${id}`, body)
}

export const deleteUser = (id: number) => {
  return userService.delete<void>(`/${id}`)
}
