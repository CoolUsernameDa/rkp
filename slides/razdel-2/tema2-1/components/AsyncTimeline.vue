<script setup>
import { computed } from 'vue'

// Отрезки: [начало, конец, тип]; тип: run — работа процессора, wait — ожидание, block — блокировка цикла
const R = 0.03
const MODES = {
  io: {
    title: 'Обработка одного сетевого запроса',
    axis: false,
    rows: [{ label: 'запрос', segs: [[0, 0.06, 'run'], [0.06, 0.94, 'wait'], [0.94, 1, 'run']] }],
    caption: 'Процессор работает в начале и в конце. Остальное время уходит на ожидание сети.',
  },
  interleave: {
    title: 'Одновременность: одно ядро, задачи чередуются',
    axis: false,
    rows: [
      { label: 'A', segs: [[0, 0.2, 'run'], [0.4, 0.6, 'run'], [0.8, 0.9, 'run']] },
      { label: 'B', segs: [[0.2, 0.4, 'run'], [0.6, 0.8, 'run'], [0.9, 1, 'run']] },
    ],
    caption: 'В каждый момент выполняется одна задача, но обе продвигаются.',
  },
  parallel: {
    title: 'Параллелизм: два ядра работают одновременно',
    axis: false,
    rows: [
      { label: 'ядро 1: A', segs: [[0, 1, 'run']] },
      { label: 'ядро 2: B', segs: [[0, 1, 'run']] },
    ],
    caption: 'Обе задачи физически выполняются в одно и то же время.',
  },
  sequential: {
    title: 'Последовательные await',
    total: 3,
    rows: [
      { label: 'чай', segs: [[0, R, 'run'], [R, 1, 'wait']] },
      { label: 'кофе', segs: [[1, 1 + R, 'run'], [1 + R, 2, 'wait']] },
      { label: 'какао', segs: [[2, 2 + R, 'run'], [2 + R, 3, 'wait']] },
    ],
    caption: 'Каждое ожидание начинается после предыдущего: 3.0 с.',
  },
  gather: {
    title: 'asyncio.gather',
    total: 1,
    rows: [
      { label: 'чай', segs: [[0, R, 'run'], [R, 1, 'wait']] },
      { label: 'кофе', segs: [[R, 2 * R, 'run'], [2 * R, 1, 'wait']] },
      { label: 'какао', segs: [[2 * R, 3 * R, 'run'], [3 * R, 1, 'wait']] },
    ],
    caption: 'Ожидания идут одновременно в одном потоке: 1.0 с.',
  },
  threads: {
    title: 'Три потока (threading)',
    total: 1,
    rows: [
      { label: 'поток 1', segs: [[0, R, 'run'], [R, 1, 'wait']] },
      { label: 'поток 2', segs: [[0, R, 'run'], [R, 1, 'wait']] },
      { label: 'поток 3', segs: [[0, R, 'run'], [R, 1, 'wait']] },
    ],
    caption: 'Тот же результат, 1.0 с. Переключает потоки операционная система.',
  },
  blocking: {
    title: 'time.sleep внутри корутин под gather',
    total: 3,
    rows: [
      { label: 'чай', segs: [[0, 1, 'block']] },
      { label: 'кофе', segs: [[1, 2, 'block']] },
      { label: 'какао', segs: [[2, 3, 'block']] },
    ],
    caption: 'time.sleep не отдаёт управление циклу: задачи идут по очереди, 3.0 с.',
  },
  cpu: {
    title: 'Три вычисления без await под gather',
    total: 1.9,
    rows: [
      { label: 'heavy 1', segs: [[0, 0.63, 'run']] },
      { label: 'heavy 2', segs: [[0.63, 1.27, 'run']] },
      { label: 'heavy 3', segs: [[1.27, 1.9, 'run']] },
    ],
    caption: 'Ждать нечего: задачи выполняются одна за другой, 1.9 с против 0.6 с для одной.',
  },
}

const props = defineProps({
  modes: { type: Array, default: () => ['sequential', 'gather'] },
  step: { type: Number, default: 99 },
  shared: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
})

const shown = computed(() => props.modes.slice(0, Math.max(1, props.step + 1)).map((m) => MODES[m]).filter(Boolean))
const scaleOf = (m) => (props.shared ? Math.max(...props.modes.map((x) => MODES[x]?.total || 1)) : m.total || 1)
const ticks = (m) => {
  const sc = scaleOf(m)
  const out = []
  for (let t = 0; t <= sc + 1e-9; t += sc > 2 ? 1 : 0.5) out.push(t)
  return out
}
const used = computed(() => new Set(shown.value.flatMap((m) => m.rows.flatMap((r) => r.segs.map((sg) => sg[2])))))
const pos = (v, m) => (v / scaleOf(m)) * 100 + '%'
const wid = (a, b, m) => ((b - a) / scaleOf(m)) * 100 + '%'
</script>

<template>
  <div class="tl" :class="{ compact }">
    <div v-for="(m, mi) in shown" :key="mi" class="chart">
      <div class="title">{{ m.title }}</div>
      <div v-for="r in m.rows" :key="r.label" class="row">
        <div class="lab">{{ r.label }}</div>
        <div class="track">
          <div v-for="(sg, si) in r.segs" :key="si" class="seg" :class="sg[2]" :style="{ left: pos(sg[0], m), width: wid(sg[0], sg[1], m) }"></div>
        </div>
      </div>
      <div v-if="m.axis !== false" class="row axis">
        <div class="lab"></div>
        <div class="track ticks">
          <span v-for="t in ticks(m)" :key="t" class="tick" :style="{ left: pos(t, m) }">{{ t }} с</span>
        </div>
      </div>
      <div class="cap">{{ m.caption }}</div>
    </div>
    <div class="legend">
      <span v-if="used.has('run')"><i class="seg run"></i> работа процессора</span>
      <span v-if="used.has('wait')"><i class="seg wait"></i> ожидание</span>
      <span v-if="used.has('block')"><i class="seg block"></i> цикл заблокирован</span>
    </div>
  </div>
</template>

<style scoped>
.tl { font-size: 0.66em; display: flex; flex-direction: column; gap: 0.7em; margin-top: 0.4em; }
.tl.compact { font-size: 0.58em; gap: 0.45em; }
.tl.compact .row { margin: 0.12em 0; }
.title { font-weight: 700; margin-bottom: 0.2em; }
.row { display: flex; align-items: center; gap: 0.6em; margin: 0.2em 0; }
.lab { width: 6.5em; flex: none; font-family: monospace; text-align: right; }
.track { position: relative; flex: 1; height: 1.25em; background: rgba(128, 128, 128, 0.12); border-radius: 0.25em; }
.seg { position: absolute; top: 0; height: 100%; border-radius: 0.2em; }
.seg.run { background: #22c55e; }
.seg.wait { background: repeating-linear-gradient(45deg, rgba(249, 115, 22, 0.55) 0 6px, rgba(249, 115, 22, 0.2) 6px 12px); }
.seg.block { background: #ef4444; }
.axis .track { background: none; height: 1em; }
.tick { position: absolute; transform: translateX(-50%); font-size: 0.8em; opacity: 0.7; white-space: nowrap; }
.cap { opacity: 0.85; margin-top: 0.2em; padding-left: 7.1em; }
.legend { display: flex; gap: 1.4em; opacity: 0.85; font-size: 0.9em; }
.legend i.seg { position: relative; display: inline-block; width: 1.6em; height: 0.8em; vertical-align: middle; }
</style>
