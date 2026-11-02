<script setup>
import { computed } from 'vue'
import { sec } from './dockerData.js'

const props = defineProps({ step: { type: Number, default: 0 } })

const GOOD = [
  { line: 'FROM python:3.12-slim', redo: false },
  { line: 'WORKDIR /app', redo: false },
  { line: 'COPY requirements.txt .', redo: false },
  { line: 'RUN pip install ...', redo: false },
  { line: 'COPY app.py .', redo: true, changed: true },
]
const BAD = [
  { line: 'FROM python:3.12-slim', redo: false },
  { line: 'WORKDIR /app', redo: false },
  { line: 'COPY . .', redo: true, changed: true },
  { line: 'RUN pip install ...', redo: true },
]
const cols = [
  { title: 'Сначала зависимости', rows: GOOD, key: 'build_good_rebuild', first: 'build_good_first' },
  { title: 'Сначала весь код', rows: BAD, key: 'build_bad_rebuild', first: 'build_bad_first' },
]
const notes = [
  'Два Dockerfile для одного приложения. Отличается только порядок инструкций.',
  'В app.py поменялась одна строка. Сборка запускается снова.',
  'Docker идёт по инструкциям сверху вниз. Пока входные файлы слоя не изменились, слой берётся из кэша (CACHED). С первого изменённого слоя всё, что выше, собирается заново.',
  'Справа pip install выполняется при каждой правке кода. Слева зависимости переустанавливаются, только когда меняется requirements.txt.',
]
const note = computed(() => notes[Math.min(props.step, notes.length - 1)])
const state = (r) => (props.step < 2 ? (props.step >= 1 && r.changed ? 'changed' : '') : r.redo ? 'redo' : 'cached')
const label = (r) => (props.step < 2 ? (props.step >= 1 && r.changed ? 'app.py изменён' : '') : r.redo ? 'собирается заново' : 'CACHED')
const time = (k) => sec(k) ?? '…'
</script>

<template>
  <div class="bc">
    <div v-for="c in cols" :key="c.key" class="col">
      <div class="title">{{ c.title }}</div>
      <div v-for="r in c.rows" :key="r.line" class="row" :class="state(r)">
        <code>{{ r.line }}</code>
        <span class="tag">{{ label(r) }}</span>
      </div>
      <div class="time" :class="{ show: step >= 3 }">
        пересборка: <b>{{ time(c.key) }}{{ time(c.key) === '…' ? '' : ' с' }}</b>
        <span class="first">(первая сборка {{ time(c.first) }}{{ time(c.first) === '…' ? '' : ' с' }})</span>
      </div>
    </div>
    <div class="note">{{ note }}</div>
  </div>
</template>

<style scoped>
.bc { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7em 1.4em; font-size: 0.72em; margin-top: 0.5em; }
.title { font-weight: 700; margin-bottom: 0.35em; }
.row { display: flex; justify-content: space-between; align-items: center; padding: 0.35em 0.6em; margin-bottom: 0.3em; border-radius: 0.35em; background: rgba(128, 128, 128, 0.14); border-left: 4px solid transparent; transition: all 0.25s; }
.row code { background: none; padding: 0; }
.row.changed { border-left-color: #f97316; background: rgba(249, 115, 22, 0.18); }
.row.cached { border-left-color: #22c55e; background: rgba(34, 197, 94, 0.16); }
.row.redo { border-left-color: #ef4444; background: rgba(239, 68, 68, 0.18); }
.tag { font-size: 0.8em; font-family: monospace; white-space: nowrap; margin-left: 0.6em; }
.time { margin-top: 0.4em; opacity: 0; transition: opacity 0.25s; }
.time.show { opacity: 1; }
.first { opacity: 0.7; margin-left: 0.4em; font-size: 0.9em; }
.note { grid-column: 1 / -1; padding: 0.4em 0.8em; border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); border-radius: 0.2em; }
</style>
