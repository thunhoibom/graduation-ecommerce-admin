import { useCallback, useEffect, useMemo } from 'react'
import qs, { ParseOptions } from 'query-string'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
//
import { makeNewSearchParam, TParamKey, TParamValue } from '../utils/url'

type UseSyncSearchParamsArgs<T> = {
  defaultParams?: T
  shouldOverrideByDefault?: boolean
}

export const qsOptions: ParseOptions = { arrayFormat: 'bracket' }

const handleParams = (
  params: Record<TParamKey, TParamValue>,
  cb: (curParams: URLSearchParams, [key, value]: [TParamKey, TParamValue]) => URLSearchParams,
  defaultSearchParams: URLSearchParams,
) => Object.entries(params).reduce(cb, defaultSearchParams)

// Note: currently only supports append to search parameters, doesn't change search parameters completely,
export const useSearchParamsState = <T extends Record<TParamKey, TParamValue> = {}>(
  args?: UseSyncSearchParamsArgs<T>,
) => {
  const { defaultParams, shouldOverrideByDefault = false } = args ?? {}
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const params = useMemo(() => qs.parse(searchParams.toString(), qsOptions) as T, [searchParams])

  const updateSearchParams = useCallback((newSearchParams: URLSearchParams) => {
    const search = newSearchParams.toString()
    const query = search
      ? `?${qs.stringify(qs.parse(search), {
          skipEmptyString: true,
          skipNull: true,
        })}`
      : ''

    router.replace(`${pathname}${query}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setSearchParamsState = useCallback(
    (newPartialParams: Partial<T>, replaceAll: boolean = false) => {
      updateSearchParams(
        handleParams(
          replaceAll ? newPartialParams : Object.assign(params, newPartialParams),
          (curSP, [key, value]) => makeNewSearchParam(curSP, { key, value }),
          new URLSearchParams(),
        ),
      )
    },
    [updateSearchParams, params],
  )

  useEffect(() => {
    if (!defaultParams) return

    updateSearchParams(
      handleParams(
        defaultParams,
        (curSP, [key, value]) => {
          if (curSP.has(key) && !shouldOverrideByDefault) {
            return curSP
          }

          return makeNewSearchParam(curSP, { key, value })
        },
        searchParams,
      ),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    params,
    setSearchParamsState,
  }
}
