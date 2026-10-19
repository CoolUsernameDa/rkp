<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [10, 20, 30] },
  step: { type: Number, default: 0 },
  name: { type: String, default: 'it' },
  extra: { type: Array, default: () => [] },
})

const n = computed(() => props.items.length)
const consumed = computed(() => Math.min(props.step, n.value))
const stopped = computed(() => props.step > n.value)
const pointerAt = computed(() => consumed.value)

const show = (v) => (typeof v === 'string' ? `'${v}'` : String(v))

const cellClass = (i) => {
  if (stopped.value) return 'done'
  if (i === consumed.value - 1) return 'current'
  if (i < consumed.value - 1) return 'done'
  return ''
}

const log = computed(() => {
  const lines = [{ text: `${props.name} = iter(...)`, kind: 'info' }]
  props.items.forEach((v, i) => {
    if (props.step >= i + 1) lines.push({ text: `next(${props.name})  →  ${show(v)}`, kind: 'value' })
  })
  if (props.step >= n.value + 1) lines.push({ text: `next(${props.name})  →  StopIteration`, kind: 'stop' })
  props.extra.forEach((t, i) => {
    if (props.step >= n.value + 2 + i) lines.push({ text: t, kind: 'info' })
  })
  return lines
})
</script>

<template>
  <div class="stepper">
    <div class="row">
      <div v-for="(it, i) in items" :key="i" class="cell" :class="cellClass(i)">{{ show(it) }}</div>
      <div class="cell end" :class="{ hit: stopped }">конец</div>
    </div>
    <div class="row">
      <div v-for="i in n + 1" :key="i" class="slot">
        <span v-if="pointerAt === i - 1" class="ptr" :class="{ stop: stopped }">▲ {{ name }}</span>
      </div>
    </div>
    <div class="log">
      <div v-for="(l, i) in log" :key="i" :class="l.kind">{{ l.text }}</div>
    </div>
  </div>
</template>

<style scoped>
.stepper { font-size: 0.8em; margin-top: 0.6em; }
.row { display: flex; gap: 0.5em; }
.cell, .slot { width: 3.6em; text-align: center; }
.cell {
  padding: 0.35em 0; border: 2px solid rgba(128, 128, 128, 0.55); border-radius: 0.4em;
  font-family: monospace; transition: all 0.25s;
}
.cell.current { background: rgba(59, 130, 246, 0.25); border-color: #3b82f6; font-weight: 700; }
.cell.done { opacity: 0.35; text-decoration: line-through; }
.cell.end { border-style: dashed; font-size: 0.8em; padding: 0.55em 0; }
.cell.end.hit { border-color: #ef4444; background: rgba(239, 68, 68, 0.2); opacity: 1; }
.slot { height: 1.5em; }
.ptr { color: #3b82f6; font-weight: 700; font-size: 0.85em; }
.ptr.stop { color: #ef4444; }
.log {
  margin-top: 0.7em; padding: 0.6em 0.9em; border-radius: 0.4em; background: #1e1e2e;
  font-family: monospace; font-size: 0.85em; line-height: 1.5; min-height: 4.5em; color: #cdd6f4;
}
.log .value { color: #a6e3a1; }
.log .stop { color: #f38ba8; }
.log .info { color: #9399b2; }
</style>
