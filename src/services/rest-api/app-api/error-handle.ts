import { isEmpty } from 'lodash-es'
import { BaseError } from '@/shared/utils/error'
import { TErrorName, TServerError } from './types'

type TConstructorProps = TServerError & { name: TErrorName; status: number }

export class AppApiError extends BaseError<TErrorName, Record<string, unknown>> {
  constructor({ message, errors, code, name, path, timestamp, status }: TConstructorProps) {
    super({
      name,
      message: generateMessage({ status, message, errors, code }),
      cause: path,
      extraData: {
        errors,
        code,
        message,
        path,
        timestamp,
        status,
      },
    })
  }
}

export type TAppApiError = InstanceType<typeof AppApiError>

export function getErrorMessage(error: any) {
  if (error instanceof AppApiError) return error.message
  if (typeof error === 'string') return error
  if (error?.message && typeof error.message === 'string') return error.message
  if (error?.response?.data?.message) return error.response.data.message
  return error?.errorFields ? null : String(error)
}

const generateMessage = ({
  status,
  message,
  errors,
  code,
}: Pick<TConstructorProps, 'status' | 'message' | 'errors' | 'code'>) => {
  const serverErrorMsg = isEmpty(errors) ? message : (Object.values(errors!)[0] ?? '')

  if (serverErrorMsg) {
    switch (code) {
      case 'SERVICE_CODE_EXISTS':
      case 'INPUT_DEF_ALREADY_EXISTS':
      case 'TABLE_OUTPUT_ALREADY_EXISTS':
      case 'TABLE_OUTPUT_IN_USE':
        return serverErrorMsg
      case 'TABLE_OUTPUT_METADATA_ERROR':
        return 'Không thể tải cấu trúc bảng dữ liệu. Vui lòng kiểm tra lại tên bảng hoặc liên hệ quản trị hệ thống.'
      default:
        return serverErrorMsg
    }
  }

  switch (status) {
    case 400:
      return 'Yêu cầu không hợp lệ.'
    case 401:
      return 'errors.api.session_expired'
    case 500:
      return 'errors.api.server_error'
    default:
      return 'Có lỗi xảy ra. Vui lòng thử lại sau'
  }
}
