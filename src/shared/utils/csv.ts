/**
 * Lightweight CSV utility — no external library required.
 * Handles encoding, parsing, and generation for import/export flows.
 */

/** Parse a CSV string into an array of objects (header row required). */
export const parseCSV = (text: string): Record<string, string>[] => {
  const rows: Record<string, string>[] = []
  const lines = text.split(/\r?\n/)
  if (lines.length === 0) return rows

  // Split header
  const header = splitLine(lines[0])

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = splitLine(line)
    const row: Record<string, string> = {}
    header.forEach((col, idx) => {
      row[col] = values[idx] ?? ''
    })
    rows.push(row)
  }

  return rows
}

/** Build a CSV string from headers and row data. */
export const generateCSV = (
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string => {
  const lines: string[] = []
  lines.push(headers.join(','))

  for (const row of rows) {
    lines.push(row.map((cell) => escapeCSV(String(cell ?? ''))).join(','))
  }

  return lines.join('\n')
}

/** Download a CSV string as a file in the browser. */
export const downloadCSV = (
  filename: string,
  csvContent: string,
  mimeType = 'text/csv;charset=utf-8;'
): void => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: mimeType }) // BOM for Excel UTF-8
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Build the export URL with optional query params. */
export const buildExportUrl = (
  baseUrl: string,
  params?: Record<string, string | number | boolean | undefined>
): string => {
  const url = new URL(baseUrl, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v))
      }
    })
  }
  return url.toString()
}

/** Escape a single CSV cell value. */
const escapeCSV = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Split a CSV line respecting quoted values. */
const splitLine = (line: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }

  result.push(current.trim())
  return result
}
