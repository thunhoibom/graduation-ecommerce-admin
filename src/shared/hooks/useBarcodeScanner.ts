import { useEffect, useRef } from 'react'

interface UseBarcodeScannerProps {
  onScan: (barcode: string) => void
  isActive: boolean
  timeout?: number
}

/**
 * Hook to listen for barcode scanner inputs globally.
 * Barcode scanners act like fast keyboards ending with an 'Enter' key.
 */
export function useBarcodeScanner({ onScan, isActive, timeout = 50 }: UseBarcodeScannerProps) {
  const bufferRef = useRef<string>('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return
      }

      // If Enter is pressed and buffer has content, we consider it a scan
      if (e.key === 'Enter' && bufferRef.current.length > 0) {
        onScan(bufferRef.current)
        bufferRef.current = ''
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        return
      }

      // Only accept printable characters
      if (e.key.length === 1) {
        bufferRef.current += e.key

        // Reset buffer if no key is pressed within timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = ''
        }, timeout)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isActive, onScan, timeout])
}
