<script setup>
import { computed } from 'vue'

const NODES = [
  { id: 'pending', title: 'Запланирована', x: 0, y: 0 },
  { id: 'running', title: 'Выполняется', x: 1, y: 0 },
  { id: 'waiting', title: 'Ждёт (await)', x: 1, y: 1 },
  { id: 'done', title: 'Завершена', x: 2, y: 0 },
  { id: 'cancelled', title: 'Отменена', x: 2, y: 1 },
]

const STEPS = [
  { node: null, code: 'coro = work()', info: 'Объект-корутина создан, задачи ещё нет, цикл о нём не знает.' },
  { node: 'pending', code: 'task = asyncio.create_task(coro)', info: 'Задача создана и стоит в очереди готовых. task.done() → False' },
  { node: 'running', code: '# цикл дошёл до задачи', info: 'Цикл выполняет код корутины до первого await.' },
  { node: 'waiting', code: 'await asyncio.sleep(1)', info: 'Задача приостановлена, цикл выполняет другие задачи.' },
  { node: 'running', code: '# прошла 1 с', info: 'Ожидание закончилось, задача снова выполняется с места остановки.' },
  { node: 'done', code: 'return 42', info: 'task.done() → True, task.result() → 42' },
  { node: 'cancelled', code: 'task.cancel()', info: 'Другой путь: при отмене внутри задачи на месте await поднимается CancelledError. task.cancelled() → True' },
]

const props = defineProps({ step: { type: Number, default: 0 } })
const s = computed(() => STEPS[Math.max(0, Math.min(props.step, STEPS.length - 1))])
const visited = computed(() => new Set(STEPS.slice(0, Math.min(props.step, 5) + 1).map((x) => x.node)))
</script>

<template>
  <div class="ts">
    <div class="graph">
      <div v-for="n in NODES" :key="n.id" class="node" :class="{ on: s.node === n.id, seen: visited.has(n.id), bad: n.id === 'cancelled' }"
        :style="{ gridColumn: n.x + 1, gridRow: n.y + 1 }">{{ n.title }}</div>
      <div class="arr a1">→</div>
      <div class="arr a2">⇅</div>
      <div class="arr a3">→</div>
      <div class="arr a4">↘</div>
    </div>
    <div class="code">{{ s.code }}</div>
    <div class="note">{{ s.info }}</div>
  </div>
</template>

<style scoped>
.ts { font-size: 0.78em; margin-top: 0.5em; display: flex; flex-direction: column; gap: 0.7em; }
.graph { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: auto auto; gap: 1.4em 3.2em; }
.node { text-align: center; padding: 0.6em 0.4em; border-radius: 0.5em; border: 2px solid rgba(128, 128, 128, 0.5); opacity: 0.55; transition: all 0.25s; }
.node.seen { opacity: 0.85; }
.node.on { opacity: 1; border-color: #22c55e; background: rgba(34, 197, 94, 0.22); font-weight: 700; }
.node.bad.on { border-color: #ef4444; background: rgba(239, 68, 68, 0.2); }
.arr { position: absolute; opacity: 0.6; font-size: 1.3em; }
.a1 { left: calc(33.3% - 1.9em); top: 0.45em; }
.a2 { left: calc(50% - 0.4em); top: 2.55em; }
.a3 { left: calc(66.6% - 1.3em); top: 0.45em; }
.a4 { left: calc(66.6% - 1.6em); top: 2.4em; }
.code { font-family: monospace; background: #1e1e2e; color: #cdd6f4; padding: 0.4em 0.8em; border-radius: 0.4em; }
.note { padding: 0.4em 0.8em; border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); border-radius: 0.2em; }
</style>
