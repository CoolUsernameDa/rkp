<script setup>
import { computed } from 'vue'
import { history, formatBytes } from './dockerData.js'

const props = defineProps({ step: { type: Number, default: 0 } })

// Строки Dockerfile образа counter:good и шаблоны, по которым их находим в docker history
const OURS = [
  { line: 'WORKDIR /app', rx: /^WORKDIR \/app/ },
  { line: 'COPY requirements.txt .', rx: /^COPY requirements\.txt/ },
  { line: 'RUN pip install --no-cache-dir -r requirements.txt', rx: /^RUN .*pip install/ },
  { line: 'COPY app.py .', rx: /^COPY app\.py/ },
]

const data = computed(() => {
  const h = history('history_good_raw')
  if (!h) return null
  const cut = h.findIndex((r) => /^WORKDIR \/app/.test(r.by))
  if (cut < 0) return null
  const own = h.slice(0, cut + 1)
  // Строки ENV и CMD с размером 0 B только меняют настройки: слоями считаем строки с файлами
  const base = h.slice(cut + 1).filter((r) => r.bytes > 0)
  return {
    base: { count: base.length, bytes: base.reduce((a, r) => a + r.bytes, 0) },
    sizes: OURS.map((o) => {
      const r = own.find((x) => o.rx.test(x.by))
      return r ? formatBytes(r.bytes) : '?'
    }),
  }
})

function layers(n) {
  const d = n % 10, h = n % 100
  const word = d === 1 && h !== 11 ? 'слой' : d >= 2 && d <= 4 && (h < 12 || h > 14) ? 'слоя' : 'слоёв'
  return `${n} ${word}`
}

const notes = [
  'Сборка начинается с базового образа. Его слои скачаны из реестра и только читаются.',
  'Каждая инструкция, которая меняет файлы, добавляет поверх новый слой.',
  'Файл requirements.txt попадает в отдельный маленький слой.',
  'Установленные библиотеки дают самый тяжёлый из собственных слоёв.',
  'Код приложения ложится последним слоем.',
  'EXPOSE и CMD записывают только настройки образа. Файлов они не добавляют.',
  'Контейнер состоит из слоёв образа и тонкого слоя для записи сверху. Два контейнера делят одни и те же слои образа, у каждого только свой слой записи.',
]
const note = computed(() => notes[Math.min(props.step, notes.length - 1)])
</script>

<template>
  <div class="il">
    <div class="stack">
      <div class="containers" :class="{ show: step >= 6 }">
        <div class="ctr">контейнер 1: слой записи</div>
        <div class="ctr">контейнер 2: слой записи</div>
      </div>
      <div class="layer meta" :class="{ show: step >= 5 }">
        <code>EXPOSE 8000 и CMD ["python", "app.py"]</code>
        <span class="size">настройки, 0 Б</span>
      </div>
      <div v-for="i in [3, 2, 1, 0]" :key="i" class="layer own" :class="{ show: step >= i + 1 }">
        <code>{{ OURS[i].line }}</code>
        <span class="size">{{ data ? data.sizes[i] : '…' }}</span>
      </div>
      <div class="layer base show">
        <code>FROM python:3.12-slim</code>
        <span class="size">
          {{ data ? `${layers(data.base.count)}, ${formatBytes(data.base.bytes)}` : 'слои базового образа, …' }}
        </span>
      </div>
    </div>
    <div class="note">{{ note }}</div>
  </div>
</template>

<style scoped>
.il { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.2em; font-size: 0.7em; margin-top: 0.4em; align-items: center; }
.stack { display: flex; flex-direction: column; gap: 0.3em; }
.layer { display: flex; justify-content: space-between; align-items: center; gap: 0.8em; padding: 0.4em 0.7em; border-radius: 0.35em; opacity: 0; transform: translateY(-0.4em); transition: all 0.3s; }
.layer.show { opacity: 1; transform: none; }
.layer code { background: none; padding: 0; }
.base { background: rgba(128, 128, 128, 0.3); }
.own { background: rgba(59, 130, 246, 0.22); }
.meta { background: rgba(168, 85, 247, 0.15); border: 1px dashed #a855f7; }
.size { font-family: monospace; font-weight: 700; white-space: nowrap; }
.containers { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4em; opacity: 0; transition: opacity 0.3s; }
.containers.show { opacity: 1; }
.ctr { text-align: center; padding: 0.4em; border-radius: 0.35em; border: 2px solid #22c55e; background: rgba(34, 197, 94, 0.18); }
.note { padding: 0.5em 0.8em; border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); border-radius: 0.2em; }
</style>
