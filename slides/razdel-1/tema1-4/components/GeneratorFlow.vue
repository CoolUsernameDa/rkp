<script setup>
import { computed } from 'vue'

const PRESETS = {
  count: {
    call: 'g = count_to(2)',
    code: [
      'def count_to(n):',
      '    i = 1',
      '    while i <= n:',
      '        yield i',
      '        i += 1',
    ],
    steps: [
      { line: null, vars: null, note: 'Генератор создан. Тело функции ещё не выполнялось.' },
      { line: 3, vars: { n: 2, i: 1 }, yielded: 1, note: 'Выполнение дошло до yield: значение 1 отдано, функция приостановлена.' },
      { line: 3, vars: { n: 2, i: 2 }, yielded: 2, note: 'Продолжение с места остановки: i увеличилось, снова yield. Значение i сохранилось.' },
      { line: null, vars: { n: 2, i: 3 }, end: true, note: 'Условие цикла ложно, функция завершилась: генератор поднимает StopIteration.' },
    ],
  },
  prints: {
    call: 'g = gen()',
    code: [
      'def gen():',
      '    print("старт")',
      '    yield 1',
      '    print("между")',
      '    yield 2',
      '    print("конец")',
    ],
    steps: [
      { line: null, vars: null, note: 'Генератор создан. Ни один print ещё не выполнился.' },
      { line: 2, vars: {}, out: 'старт', yielded: 1, note: 'Первый next(): выполнилось всё до первого yield.' },
      { line: 4, vars: {}, out: 'между', yielded: 2, note: 'Второй next(): продолжение с места остановки до следующего yield.' },
      { line: null, vars: {}, out: 'конец', end: true, note: 'Третий next(): код дошёл до конца функции, поднят StopIteration.' },
    ],
  },
  delegate: {
    call: 'g = chain_two()',
    code: [
      'def chain_two():',
      '    yield from [1, 2]',
      '    yield from "ab"',
    ],
    steps: [
      { line: null, vars: null, note: 'Генератор создан.' },
      { line: 1, vars: {}, yielded: 1, note: 'yield from передаёт значения вложенной последовательности по одному.' },
      { line: 1, vars: {}, yielded: 2, note: 'Первая последовательность ещё не исчерпана.' },
      { line: 2, vars: {}, yielded: 'a', note: 'Первая последовательность закончилась, начинается вторая.' },
      { line: 2, vars: {}, yielded: 'b', note: 'Вторая последовательность.' },
      { line: null, vars: {}, end: true, note: 'Обе последовательности исчерпаны: StopIteration.' },
    ],
  },
}

const props = defineProps({
  preset: { type: String, default: 'count' },
  step: { type: Number, default: 0 },
})

const data = computed(() => PRESETS[props.preset] || PRESETS.count)
const idx = computed(() => Math.max(0, Math.min(props.step, data.value.steps.length - 1)))
const state = computed(() => data.value.steps[idx.value])
const yielded = computed(() =>
  data.value.steps.slice(0, idx.value + 1).filter((s) => s.yielded !== undefined).map((s) => s.yielded),
)
const outs = computed(() => data.value.steps.slice(0, idx.value + 1).filter((s) => s.out).map((s) => s.out))
const show = (v) => (typeof v === 'string' ? `'${v}'` : String(v))
</script>

<template>
  <div class="flow">
    <div class="left">
      <div class="call">{{ data.call }}</div>
      <div class="code">
        <div v-for="(l, i) in data.code" :key="i" class="line" :class="{ on: state.line === i }">
          <span class="gutter">{{ state.line === i ? '▶' : '' }}</span><span class="src">{{ l }}</span>
        </div>
      </div>
      <div class="calls">Вызовов <code>next(g)</code>: {{ idx }}</div>
    </div>
    <div class="right">
      <div class="panel">
        <div class="title">Локальные переменные</div>
        <div v-if="state.vars === null" class="muted">пока нет</div>
        <div v-else-if="Object.keys(state.vars).length === 0" class="muted">нет</div>
        <div v-else v-for="(v, k) in state.vars" :key="k" class="var"><b>{{ k }}</b> = {{ v }}</div>
      </div>
      <div class="panel">
        <div class="title">Отдано через yield</div>
        <div class="vals">
          <span v-for="(y, i) in yielded" :key="i" class="chip">{{ show(y) }}</span>
          <span v-if="state.end" class="chip stop">StopIteration</span>
          <span v-if="!yielded.length && !state.end" class="muted">пока ничего</span>
        </div>
      </div>
      <div v-if="data.steps.some((s) => s.out)" class="panel out">
        <div class="title">Вывод print</div>
        <div v-for="(o, i) in outs" :key="i" class="mono">{{ o }}</div>
        <div v-if="!outs.length" class="muted">пока пусто</div>
      </div>
    </div>
    <div class="note">{{ state.note }}</div>
  </div>
</template>

<style scoped>
.flow { display: grid; grid-template-columns: 1.25fr 1fr; gap: 0.9em 1.2em; font-size: 0.72em; margin-top: 0.4em; }
.call { font-family: monospace; opacity: 0.75; margin-bottom: 0.4em; }
.code { background: #1e1e2e; color: #cdd6f4; border-radius: 0.4em; padding: 0.6em 0.5em; font-family: monospace; }
.line { display: flex; padding: 0.12em 0.3em; border-radius: 0.25em; white-space: pre; }
.line.on { background: rgba(59, 130, 246, 0.35); }
.gutter { width: 1.4em; color: #89b4fa; flex: none; }
.calls { margin-top: 0.5em; opacity: 0.8; }
.right { display: flex; flex-direction: column; gap: 0.5em; }
.panel { border: 1px solid rgba(128, 128, 128, 0.5); border-radius: 0.4em; padding: 0.4em 0.7em; }
.title { font-size: 0.8em; opacity: 0.65; margin-bottom: 0.2em; }
.muted { opacity: 0.5; }
.var, .mono { font-family: monospace; }
.vals { display: flex; flex-wrap: wrap; gap: 0.35em; }
.chip { background: rgba(34, 197, 94, 0.25); border: 1px solid #22c55e; border-radius: 0.3em; padding: 0 0.5em; font-family: monospace; }
.chip.stop { background: rgba(239, 68, 68, 0.25); border-color: #ef4444; }
.note { grid-column: 1 / -1; padding: 0.4em 0.8em; border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); border-radius: 0.2em; }
</style>
