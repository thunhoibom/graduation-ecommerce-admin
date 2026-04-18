import { useCallback, useLayoutEffect, useRef, useState } from 'react'

export const useLoadMore = ({
  hasMore,
  loading,
  loadMore,
}: {
  hasMore: boolean
  loading: boolean
  loadMore: VoidFunction
}) => {
  const rootEleRef = useRef<HTMLDivElement | null>(null)
  const [distanceBottom, setDistanceBottom] = useState(0)

  const scrollListener = useCallback(() => {
    if (!rootEleRef.current) return
    const bottom = rootEleRef.current.scrollHeight - rootEleRef.current.clientHeight

    if (!distanceBottom) {
      setDistanceBottom(Math.round(bottom * 0.2))
    }

    if (rootEleRef.current.scrollTop > bottom - distanceBottom && hasMore && !loading) {
      loadMore()
    }
  }, [hasMore, loadMore, loading, distanceBottom])

  useLayoutEffect(() => {
    const rootEle = rootEleRef.current
    rootEle?.addEventListener('scroll', scrollListener)

    return () => {
      rootEle?.removeEventListener('scroll', scrollListener)
    }
  }, [scrollListener])

  return { rootEleRef }
}
