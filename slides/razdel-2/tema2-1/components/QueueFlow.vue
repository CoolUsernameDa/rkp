<script setup>
import { computed } from 'vue'

// Шаги совпадают с реальным прогоном: 6 элементов, два потребителя, обработка 0.3 с
const N = '∅'
const STEPS = [
  { t: null, queue: [], A: null, B: null, doneA: [], doneB: [], note: 'Очередь пуста. Производитель и два потребителя запущены через gather.' },
  { t: '0.0', queue: [0, 1, 2, 3, 4, 5, N, N], A: null, B: null, doneA: [], doneB: [], note: 'Производитель кладёт шесть элементов и два маркера конца ∅, по одному на каждого потребителя.' },
  { t: '0.0', queue: [2, 3, 4, 5, N, N], A: 0, B: 1, doneA: [], doneB: [], note: 'Каждый потребитель забирает элемент через await queue.get() и обрабатывает его 0.3 с.' },
  { t: '0.3', queue: [4, 5, N, N], A: 2, B: 3, doneA: [0], doneB: [1], note: 'Освободившись, потребители берут следующие элементы.' },
  { t: '0.6', queue: [N, N], A: 4, B: 5, doneA: [0, 2], doneB: [1, 3], note: 'Элементы распределяются между потребителями сами: кто свободен, тот и берёт.' },
  { t: '0.9', queue: [], A: N, B: N, doneA: [0, 2, 4], doneB: [1, 3, 5], note: 'Каждый получил маркер ∅ и завершил цикл while.' },
]
const props = defineProps({ step: { type: Number, default: 0 } })
const s = computed(() => STEPS[Math.max(0, Math.min(props.step, STEPS.length - 1))])
</script>

<template>
  <div class="qf">
    <div class="box prod">Производитель<br><code>await queue.put(x)</code></div>
    <div class="arrow">→</div>
    <div class="queue">
      <div class="cap">Queue <span v-if="s.t" class="clock">{{ s.t }} с</span></div>
      <div class="cells">
        <span v-for="(x, i) in s.queue" :key="i" class="cell" :class="{ end: x === '∅' }">{{ x }}</span>
        <span v-if="!s.queue.length" class="muted">пусто</span>
      </div>
    </div>
    <div class="arrow">→</div>
    <div class="cons">
      <div v-for="c in ['A', 'B']" :key="c" class="box consumer">
        <div>Потребитель {{ c }}: <span class="cur" :class="{ end: s[c] === '∅' }">{{ s[c] ?? '—' }}</span></div>
        <div class="done">обработано: {{ s['done' + c].join(', ') || '—' }}</div>
      </div>
    </div>
    <div class="note">{{ s.note }}</div>
  </div>
</template>

<style scoped>
.qf { display: grid; grid-template-columns: 1fr auto 1.6fr auto 1.3fr; gap: 0.7em 0.6em; align-items: center; font-size: 0.76em; margin-top: 0.5em; }
.box { border: 2px solid rgba(128, 128, 128, 0.5); border-radius: 0.5em; padding: 0.5em 0.7em; }
.prod { border-color: #3b82f6; }
.arrow { font-size: 1.5em; opacity: 0.6; }
.queue { border: 2px solid #a855f7; border-radius: 0.5em; padding: 0.5em 0.6em; min-height: 3.5em; }
.cap { font-size: 0.9em; opacity: 0.75; margin-bottom: 0.35em; }
.clock { font-family: monospace; color: #3b82f6; font-weight: 700; opacity: 1; }
.cells { display: flex; flex-wrap: wrap; gap: 0.3em; }
.cell { font-family: monospace; padding: 0.1em 0.55em; border-radius: 0.3em; background: rgba(168, 85, 247, 0.2); border: 1px solid #a855f7; }
.cell.end { background: rgba(128, 128, 128, 0.2); border-color: rgba(128, 128, 128, 0.6); }
.cons { display: flex; flex-direction: column; gap: 0.5em; }
.consumer { border-color: #22c55e; }
.cur { font-family: monospace; font-weight: 700; color: #22c55e; }
.cur.end { color: inherit; opacity: 0.6; }
.done { font-size: 0.85em; opacity: 0.8; font-family: monospace; }
.muted { opacity: 0.45; }
.note { grid-column: 1 / -1; padding: 0.4em 0.8em; border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); border-radius: 0.2em; }
</style>
