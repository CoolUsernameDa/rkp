<script setup>
import { computed } from 'vue'

const PLAIN = {
  code: ['value = counter', 'await asyncio.sleep(0)', 'counter = value + 1'],
  steps: [
    { counter: 0, A: { line: null }, B: { line: null }, active: null, note: 'Общий счётчик равен 0. Две задачи выполняют один и тот же код.' },
    { counter: 0, A: { line: 0, value: 0 }, B: { line: null }, active: 'A', note: 'A читает counter: value = 0.' },
    { counter: 0, A: { line: 1, value: 0, paused: true }, B: { line: null }, active: null, note: 'A доходит до await и отдаёт управление циклу.' },
    { counter: 0, A: { line: 1, value: 0, paused: true }, B: { line: 0, value: 0 }, active: 'B', note: 'B читает counter — он всё ещё 0.' },
    { counter: 0, A: { line: 1, value: 0, paused: true }, B: { line: 1, value: 0, paused: true }, active: null, note: 'B тоже доходит до await.' },
    { counter: 1, A: { line: 2, value: 0 }, B: { line: 1, value: 0, paused: true }, active: 'A', note: 'A продолжает: counter = 0 + 1 = 1.' },
    { counter: 1, A: { line: null, done: true }, B: { line: 2, value: 0 }, active: 'B', lost: true, note: 'B записывает свою устаревшую копию: counter = 0 + 1 = 1. Одно увеличение потеряно.' },
  ],
}

const LOCKED = {
  code: ['async with lock:', '    value = counter', '    await asyncio.sleep(0)', '    counter = value + 1'],
  steps: [
    { counter: 0, lock: null, A: { line: null }, B: { line: null }, active: null, note: 'Тот же код внутри async with lock.' },
    { counter: 0, lock: 'A', A: { line: 1, value: 0 }, B: { line: null }, active: 'A', note: 'A захватывает замок и читает counter = 0.' },
    { counter: 0, lock: 'A', A: { line: 2, value: 0, paused: true }, B: { line: null }, active: null, note: 'A доходит до await. Замок остаётся у A.' },
    { counter: 0, lock: 'A', A: { line: 2, value: 0, paused: true }, B: { line: 0, blocked: true }, active: 'B', note: 'B пытается войти в async with lock: замок занят, B ждёт.' },
    { counter: 1, lock: null, A: { line: null, done: true }, B: { line: 0, blocked: true }, active: 'A', note: 'A записывает counter = 1 и освобождает замок.' },
    { counter: 1, lock: 'B', A: { line: null, done: true }, B: { line: 1, value: 1 }, active: 'B', note: 'B получает замок и читает актуальное значение: value = 1.' },
    { counter: 2, lock: null, A: { line: null, done: true }, B: { line: null, done: true }, active: 'B', note: 'B записывает counter = 2. Ни одно увеличение не потеряно.' },
  ],
}

const props = defineProps({
  locked: { type: Boolean, default: false },
  step: { type: Number, default: 0 },
})
const data = computed(() => (props.locked ? LOCKED : PLAIN))
const s = computed(() => data.value.steps[Math.max(0, Math.min(props.step, data.value.steps.length - 1))])
</script>

<template>
  <div class="race">
    <div v-for="name in ['A', 'B']" :key="name" class="task" :class="{ active: s.active === name }">
      <div class="head">
        Задача {{ name }}
        <span v-if="s[name].paused" class="tag wait">ждёт await</span>
        <span v-if="s[name].blocked" class="tag block">ждёт замок</span>
        <span v-if="s[name].done" class="tag done">завершена</span>
      </div>
      <div class="code">
        <div v-for="(l, i) in data.code" :key="i" class="line" :class="{ on: s[name].line === i }">{{ l }}</div>
      </div>
      <div class="local">value = {{ s[name].value ?? '—' }}</div>
    </div>
    <div class="shared">
      <div class="cap">Общие данные</div>
      <div class="counter" :class="{ lost: s.lost }">counter = {{ s.counter }}</div>
      <div v-if="locked" class="lock" :class="{ held: s.lock }">замок: {{ s.lock ? 'у ' + s.lock : 'свободен' }}</div>
    </div>
    <div class="note" :class="{ bad: s.lost }">{{ s.note }}</div>
  </div>
</template>

<style scoped>
.race { display: grid; grid-template-columns: 1fr 1fr 0.8fr; gap: 0.7em 1em; font-size: 0.7em; margin-top: 0.5em; }
.task { border: 2px solid rgba(128, 128, 128, 0.4); border-radius: 0.5em; padding: 0.4em 0.6em; transition: all 0.25s; }
.task.active { border-color: #22c55e; }
.head { font-weight: 700; margin-bottom: 0.3em; display: flex; gap: 0.5em; align-items: center; flex-wrap: wrap; }
.tag { font-weight: 400; font-size: 0.8em; padding: 0 0.4em; border-radius: 0.3em; }
.tag.wait { background: rgba(249, 115, 22, 0.25); }
.tag.block { background: rgba(239, 68, 68, 0.25); }
.tag.done { background: rgba(128, 128, 128, 0.25); }
.code { background: #1e1e2e; color: #cdd6f4; border-radius: 0.3em; padding: 0.3em; font-family: monospace; font-size: 0.92em; }
.line { white-space: pre; padding: 0.08em 0.3em; border-radius: 0.2em; }
.line.on { background: rgba(59, 130, 246, 0.45); }
.local { font-family: monospace; margin-top: 0.3em; }
.shared { border: 2px dashed rgba(128, 128, 128, 0.5); border-radius: 0.5em; padding: 0.4em 0.6em; display: flex; flex-direction: column; gap: 0.4em; }
.cap { font-size: 0.85em; opacity: 0.65; }
.counter { font-family: monospace; font-size: 1.3em; font-weight: 700; }
.counter.lost { color: #ef4444; }
.lock { font-family: monospace; }
.lock.held { color: #f97316; }
.note { grid-column: 1 / -1; padding: 0.4em 0.8em; border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); border-radius: 0.2em; }
.note.bad { border-left-color: #ef4444; background: rgba(239, 68, 68, 0.1); }
</style>
