// Реальные выводы Docker, собранные скриптом collect.py (файл docker_outputs.json).
// Пока файл не заполнен, компоненты показывают заглушки.
import raw from './docker_outputs.json'

export const steps = (raw && raw.steps) || {}
export const meta = (raw && raw.meta) || {}
export const pending = Object.keys(steps).length === 0

export const step = (k) => steps[k]

export function sec(k, digits = 1) {
  const s = steps[k]
  return s && typeof s.sec === 'number' ? s.sec.toFixed(digits).replace('.', ',') : null
}

// "12.3kB" → байты (Docker использует десятичные единицы)
export function parseSize(text) {
  const m = /^([\d.]+)\s*([kMG]?B)$/.exec((text || '').trim())
  if (!m) return 0
  const mult = { B: 1, kB: 1e3, MB: 1e6, GB: 1e9 }[m[2]]
  return parseFloat(m[1]) * mult
}

export function formatBytes(bytes) {
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(2).replace('.', ',') + ' ГБ'
  const short = (v) => (v < 10 ? v.toFixed(1).replace('.', ',') : String(Math.round(v)))
  if (bytes >= 1e6) return short(bytes / 1e6) + ' МБ'
  if (bytes >= 1e3) return short(bytes / 1e3) + ' кБ'
  return bytes + ' Б'
}

// Размер образа из шага size_<тег> (docker image inspect --format {{.Size}})
export function imageSize(tag) {
  const s = steps['size_' + tag]
  if (!s || s.rc !== 0 || !s.out.length) return null
  const n = parseInt(s.out[0], 10)
  return Number.isFinite(n) ? n : null
}

// Колонки DISK USAGE и CONTENT SIZE из вывода docker image ls (шаг images_python)
export function lsColumns(tag) {
  const s = steps.images_python
  if (!s || s.rc !== 0) return null
  const head = s.out.findIndex((l) => /DISK USAGE/.test(l) && /CONTENT SIZE/.test(l))
  if (head < 0) return null
  const row = s.out.slice(head + 1).map((l) => l.trim().split(/\s+/)).find((p) => p[0] === tag)
  return row ? { disk: row[2], content: row[3] } : null
}

// "1.62GB" → "1,62 ГБ" (число оставляем как напечатал Docker)
export function dockerSizeText(text) {
  const m = /^([\d.]+)\s*([kMG]?B)$/.exec((text || '').trim())
  if (!m) return null
  return m[1].replace('.', ',') + ' ' + { B: 'Б', kB: 'кБ', MB: 'МБ', GB: 'ГБ' }[m[2]]
}

// docker history --no-trunc --format "{{.Size}}\t{{.CreatedBy}}"
export function history(k) {
  const s = steps[k]
  if (!s || s.rc !== 0) return null
  return s.out.map((line) => {
    const [size, ...rest] = line.split('\t')
    return { size, bytes: parseSize(size), by: rest.join('\t').trim() }
  })
}
