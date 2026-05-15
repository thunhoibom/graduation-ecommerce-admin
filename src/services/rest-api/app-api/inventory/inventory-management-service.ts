import { appApiIns } from '../api-instance'

const BASE = '/api/data/inventory'

export type SupplierPojo = {
  id: number
  code: string
  name: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  active: boolean
  deleted: boolean
  createdAt?: string
  updatedAt?: string
}

export type SupplierUpsertRequest = {
  code?: string
  name: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  active?: boolean
}

export type PurchaseOrderLinePojo = {
  id: number
  variantId: number
  variantSku?: string
  productName?: string
  orderedQty: number
  receivedQty: number
  unitCost?: number
  lineTotalAmount?: number
  note?: string
}

export type PurchaseOrderPojo = {
  id: number
  code: string
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED'
  supplierId: number
  supplierCode?: string
  supplierName?: string
  expectedDate?: string
  submittedAt?: string
  approvedAt?: string
  receivedAt?: string
  requestedBy?: number
  approvedBy?: number
  warehouseId?: string
  locationCode?: string
  note?: string
  createdAt?: string
  updatedAt?: string
  lineCount?: number
  orderedTotalAmount?: number
  receivedTotalAmount?: number
  lines: PurchaseOrderLinePojo[]
}

export type PurchaseOrderCreateRequest = {
  supplierId: number
  warehouseId?: string
  locationCode?: string
  expectedDate?: string
  note?: string
  requestedBy?: number
  lines: Array<{
    variantId: number
    orderedQty: number
    unitCost?: number
    note?: string
  }>
}

export type GoodsReceiptCreateRequest = {
  receivedBy?: number
  note?: string
  lines: Array<{
    purchaseOrderLineId: number
    receivedQty: number
  }>
}

export type StockTransferLinePojo = {
  id: number
  variantId: number
  variantSku?: string
  productName?: string
  quantity: number
}

export type StockTransferPojo = {
  id: number
  code: string
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'
  warehouseId: string
  fromLocation: string
  toLocation: string
  requestedBy?: number
  approvedBy?: number
  submittedAt?: string
  approvedAt?: string
  completedAt?: string
  note?: string
  createdAt?: string
  updatedAt?: string
  lines: StockTransferLinePojo[]
}

export type StockTransferCreateRequest = {
  warehouseId?: string
  fromLocation: string
  toLocation: string
  note?: string
  requestedBy?: number
  lines: Array<{
    variantId: number
    quantity: number
  }>
}

export type StockCountLinePojo = {
  id: number
  variantId: number
  variantSku?: string
  productName?: string
  expectedQty: number
  countedQty?: number
  varianceQty?: number
  reason?: string
}

export type StockCountSessionPojo = {
  id: number
  code: string
  status: 'PLANNED' | 'IN_PROGRESS' | 'COUNTED' | 'APPROVED' | 'POSTED'
  warehouseId: string
  locationCode: string
  plannedAt?: string
  countedAt?: string
  approvedAt?: string
  postedAt?: string
  requestedBy?: number
  approvedBy?: number
  note?: string
  createdAt?: string
  updatedAt?: string
  lines: StockCountLinePojo[]
}

export type StockCountSessionCreateRequest = {
  warehouseId?: string
  locationCode?: string
  plannedAt?: string
  note?: string
  requestedBy?: number
}

export type StockCountLineUpsertRequest = {
  lines: Array<{
    variantId: number
    countedQty: number
    reason?: string
  }>
}

export type StatusActionRequest = {
  actorId?: number
  note?: string
}

export const listSuppliers = (keyword?: string) =>
  appApiIns.get<SupplierPojo[]>(`${BASE}/suppliers`, { params: { keyword } })

export const createSupplier = (payload: SupplierUpsertRequest) =>
  appApiIns.post<SupplierPojo>(`${BASE}/suppliers`, payload)

export const updateSupplier = (id: number, payload: Partial<SupplierUpsertRequest>) =>
  appApiIns.put<SupplierPojo>(`${BASE}/suppliers/${id}`, payload)

export const deleteSupplier = (id: number) =>
  appApiIns.delete<void>(`${BASE}/suppliers/${id}`)

export const listPurchaseOrders = (status?: string) =>
  appApiIns.get<PurchaseOrderPojo[]>(`${BASE}/purchase-orders`, { params: { status } })

export const getPurchaseOrderById = (id: number) =>
  appApiIns.get<PurchaseOrderPojo>(`${BASE}/purchase-orders/${id}`)

export const createPurchaseOrder = (payload: PurchaseOrderCreateRequest) =>
  appApiIns.post<PurchaseOrderPojo>(`${BASE}/purchase-orders`, payload)

export const submitPurchaseOrder = (id: number, payload?: StatusActionRequest) =>
  appApiIns.post<PurchaseOrderPojo>(`${BASE}/purchase-orders/${id}/submit`, payload ?? {})

export const approvePurchaseOrder = (id: number, payload?: StatusActionRequest) =>
  appApiIns.post<PurchaseOrderPojo>(`${BASE}/purchase-orders/${id}/approve`, payload ?? {})

export const cancelPurchaseOrder = (id: number, payload?: StatusActionRequest) =>
  appApiIns.post<PurchaseOrderPojo>(`${BASE}/purchase-orders/${id}/cancel`, payload ?? {})

export const receivePurchaseOrder = (id: number, payload: GoodsReceiptCreateRequest) =>
  appApiIns.post(`${BASE}/purchase-orders/${id}/receive`, payload)

export const listStockTransfers = (status?: string) =>
  appApiIns.get<StockTransferPojo[]>(`${BASE}/transfers`, { params: { status } })

export const getStockTransferById = (id: number) =>
  appApiIns.get<StockTransferPojo>(`${BASE}/transfers/${id}`)

export const createStockTransfer = (payload: StockTransferCreateRequest) =>
  appApiIns.post<StockTransferPojo>(`${BASE}/transfers`, payload)

export const submitStockTransfer = (id: number, payload?: StatusActionRequest) =>
  appApiIns.post<StockTransferPojo>(`${BASE}/transfers/${id}/submit`, payload ?? {})

export const approveStockTransfer = (id: number, payload?: StatusActionRequest) =>
  appApiIns.post<StockTransferPojo>(`${BASE}/transfers/${id}/approve`, payload ?? {})

export const completeStockTransfer = (id: number, payload?: StatusActionRequest) =>
  appApiIns.post<StockTransferPojo>(`${BASE}/transfers/${id}/complete`, payload ?? {})

export const cancelStockTransfer = (id: number, payload?: StatusActionRequest) =>
  appApiIns.post<StockTransferPojo>(`${BASE}/transfers/${id}/cancel`, payload ?? {})

export const listStockCounts = (status?: string) =>
  appApiIns.get<StockCountSessionPojo[]>(`${BASE}/stock-counts`, { params: { status } })

export const getStockCountById = (id: number) =>
  appApiIns.get<StockCountSessionPojo>(`${BASE}/stock-counts/${id}`)

export const createStockCount = (payload: StockCountSessionCreateRequest) =>
  appApiIns.post<StockCountSessionPojo>(`${BASE}/stock-counts`, payload)

export const startStockCount = (id: number, payload?: StatusActionRequest) =>
  appApiIns.post<StockCountSessionPojo>(`${BASE}/stock-counts/${id}/start`, payload ?? {})

export const upsertStockCountLines = (id: number, payload: StockCountLineUpsertRequest) =>
  appApiIns.post<StockCountSessionPojo>(`${BASE}/stock-counts/${id}/lines`, payload)

export const completeStockCount = (id: number, payload?: StatusActionRequest) =>
  appApiIns.post<StockCountSessionPojo>(`${BASE}/stock-counts/${id}/complete`, payload ?? {})

export const approveStockCount = (id: number, payload?: StatusActionRequest) =>
  appApiIns.post<StockCountSessionPojo>(`${BASE}/stock-counts/${id}/approve`, payload ?? {})

export const postStockCountVariance = (id: number, payload?: StatusActionRequest) =>
  appApiIns.post<StockCountSessionPojo>(`${BASE}/stock-counts/${id}/post`, payload ?? {})
