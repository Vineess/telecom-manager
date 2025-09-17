// src/lib/export.ts
export type Header<T extends Record<string, any>> = { key: keyof T; label: string }

export function toCSV<T extends Record<string, any>>(rows: T[], headers?: Header<T>[]) {
  if (!rows.length) {
    if (!headers?.length) return ""
    const head = headers.map(h => h.label).join(",")
    return head + "\n"
  }

  const cols = headers?.length
    ? headers
    : (Object.keys(rows[0]) as (keyof T)[]).map(k => ({ key: k, label: String(k) }))

  const head = cols.map(c => escapeCSV(String(c.label))).join(",")
  const body = rows
    .map(r => cols.map(c => escapeCSV(valueToString(r[c.key]))).join(","))
    .join("\n")

  return head + "\n" + body + "\n"
}

function valueToString(v: any) {
  if (v == null) return ""
  if (v instanceof Date) return v.toISOString()
  if (typeof v === "object") return JSON.stringify(v)
  return String(v)
}

function escapeCSV(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function download(filename: string, content: string, mime = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadCSV<T extends Record<string, any>>(filename: string, rows: T[], headers?: Header<T>[]) {
  const csv = toCSV(rows, headers)
  download(filename, csv)
}
