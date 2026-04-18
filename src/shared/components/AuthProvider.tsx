'use client'

import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { authService } from '@/services/rest-api/app-api/auth/authService'

type AuthProviderProps = {
  children: React.ReactNode
}



export default function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = () => {
      const publicPaths = ['/login', '/error']
      const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))
      const isAuthenticated = authService.isAuthenticated()

      if (!isAuthenticated && !isPublicPath) {
        setIsAuthorized(false)
        router.push('/login')
      } else {
        setIsAuthorized(true)
      }
    }

    checkAuth()
  }, [pathname, router])

  if (isAuthorized === null && !['/login'].some(p => pathname.startsWith(p))) {
    return null
  }

  return <>{children}</>
}
