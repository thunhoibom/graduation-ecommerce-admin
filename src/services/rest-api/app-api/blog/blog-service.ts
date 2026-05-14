import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const blogService = createApiService(appApiIns, '/api/data/blog-posts')

export type BlogStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type BlogPostPojo = {
  id?: number
  title: string
  slug?: string
  summary?: string
  content: string
  thumbnailUrl?: string
  status?: BlogStatus
  authorName?: string
  authorId?: number
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
}

export type BlogSearchParams = {
  title?: string
  status?: BlogStatus
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

export const searchBlogPosts = (params: BlogSearchParams) =>
  blogService.get<PageResponse<BlogPostPojo[]>>('', { params })

export const createBlogPost = (data: BlogPostPojo) =>
  blogService.post<void>('', data)

export const updateBlogPost = (id: number, data: BlogPostPojo) =>
  blogService.put<void>(`/${id}`, data)

export const patchBlogPost = (id: number, body: Record<string, unknown>) =>
  blogService.patch<void>(`/${id}`, body)

export const deleteBlogPost = (id: number) =>
  blogService.delete<void>(`/${id}`)
