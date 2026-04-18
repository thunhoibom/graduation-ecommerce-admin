import { PageResponse } from './common';

export interface IPayoutProfile {
    profileId: number;
    code: string;
    name: string;
    payeeName: string;
    noVatAmount: number;
    vatAmount: number;
    amount: number;
    payStatus: number; // 0 - Chờ thanh toán, 1 - Đang thanh toán, 2 - Đã thanh toán
    payMonth: string;
    createdDateTime: string;
}

export interface IPayoutItem {
    profileDtlId: number;
    transactionMonth: string;
    itemName: string;
    cost: number;
    maxLimit: number;
    costVat: number;
    advanceAmount: number;
    remainingAmount: number;
    status: number; // 0 - Chưa thanh toán, 1 - Đã thanh toán
    payMethodName?: string;
    docNo?: string;
    docTypeName?: string;
    invoiceInfo?: string;
}

export interface IPayoutDetail {
    profileId: number;
    code: string;
    name: string;
    payeeId?: number;
    payeeCode?: string;
    payeeName: string;
    organizationName: string;
    payMonth: string;
    createdDateTime?: string;
    noVatAmount: number;
    vatAmount: number;
    vatPercent: number;
    amount: number;
    paidAmount: number;
    remainingAmount: number;
    items: IPayoutItem[];
}

export interface IPayoutSearchRequest {
    page: number;
    size: number;
    fromDate?: string;
    toDate?: string;
    profileCode?: string;
    profileName?: string;
    organizationId?: number;
    payeeType?: number;
    payStatus?: number;
}

export interface IVoucherRequest {
    profileDetailIds: number[];
    voucherNo?: string;
    paymentDate?: string;
    receiverName?: string;
    receiverDob?: string;
    receiverIdCard?: string;
    receiverAddress?: string;
    description?: string;
    organizationInvoiceId?: number;
}

export interface IBankStatementRequest {
    profileDetailIds: number[];
    bankAccount?: string;
    bankName?: string;
    transferDate?: string;
    statementNo?: string;
    receiverName?: string;
    reason?: string;
    organizationInvoiceId?: number;
}

export interface IInvoiceItem {
    itemName: string;
    amount: number;
    vat?: number;
    discount?: number;
    total?: number;
}

export interface IInvoiceRequest {
    profileDetailIds: number[];
    invoiceNo?: string;
    invoiceDate?: string;
    taxCode?: string;
    address?: string;
    phone?: string;
    reason?: string;
    note?: string;
    organizationInvoiceId?: number;
    items?: IInvoiceItem[];
}

export interface IEInvoiceRequest {
    profileDetailIds: number[];
    invoicePattern?: string;
    invoiceSerial?: string;
    invoiceNo?: string;
    invoiceDate?: string;
    taxCode?: string;
    address?: string;
    phone?: string;
    reason?: string;
    note?: string;
    organizationInvoiceId?: number;
    items?: IInvoiceItem[];
}

export interface IReceiptRequest {
    profileDetailIds: number[];
    receiptNo?: string;
}

export interface IAvailableInvoice {
    orgInvoiceId: number;
    invoiceNo: string;
    serialNo: string;
    invoiceDate: string;
    amount: number;
    payeeCode: string;
    payeeName: string;
}
