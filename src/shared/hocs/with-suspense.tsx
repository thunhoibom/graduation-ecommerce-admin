'use client' // Bắt buộc cho ErrorBoundary

import React, { Suspense, forwardRef, ForwardedRef, ComponentType, ReactNode } from 'react'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'

// 1. Cải thiện kiểu dữ liệu cho ErrorFallback
const DefaultErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div role="alert" className="p-4 border border-red-500 bg-red-50">
    <p className="font-bold">Đã có lỗi xảy ra:</p>
    <pre className="text-sm">{error instanceof Error ? error.message : String(error)}</pre>
    <button onClick={resetErrorBoundary} className="mt-2 px-4 py-2 bg-red-600 text-white rounded">
      Thử lại
    </button>
  </div>
)

export function withSuspense<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: {
    fallback?: ReactNode
    ErrorComponent?: ComponentType<FallbackProps>
    onReset?: () => void
  } = {},
) {
  const {
    fallback = <div>Loading...</div>,
    ErrorComponent = DefaultErrorFallback,
    onReset,
  } = options

  const WithSuspense = forwardRef<any, P>((props, ref) => {
    return (
      <ErrorBoundary FallbackComponent={ErrorComponent} onReset={onReset}>
        <Suspense fallback={fallback}>
          <WrappedComponent {...(props as P)} ref={ref} />
        </Suspense>
      </ErrorBoundary>
    )
  })

  const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component'
  WithSuspense.displayName = `withSuspense(${componentName})`

  return WithSuspense
}
