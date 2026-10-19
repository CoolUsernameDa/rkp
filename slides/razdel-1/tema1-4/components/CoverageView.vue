<script setup>
import { computed } from 'vue'

const GOOD = [
  'def grade(score):',
  '    if score < 0:',
  '        raise ValueError("отрицательный балл")',
  '    if score >= 60:',
  '        return "зачёт"',
  '    return "незачёт"',
]
const BUGGY = [
  'def grade(score):',
  '    if score < 0:',
  '        raise ValueError("отрицательный балл")',
  '    if score >= 60:',
  '        return "незачёт"',
  '    return "зачёт"',
]

const PRESETS = {
  grade: {
    code: GOOD,
    tests: [
      { name: 'test_pass: grade(75) == "зачёт"', covers: [1, 2, 4, 5], asserts: 1 },
      { name: 'test_fail: grade(30) == "незачёт"', covers: [2, 4, 6], asserts: 1 },
      { name: 'test_negative: raises ValueError', covers: [2, 3], asserts: 1 },
    ],
  },
  noassert: {
    code: BUGGY,
    tests: [
      { name: 'grade(75)', covers: [1, 2, 4, 5], asserts: 0 },
      { name: 'grade(30)', covers: [2, 4, 6], asserts: 0 },
      { name: 'grade(-1) внутри pytest.raises', covers: [2, 3], asserts: 0 },
    ],
  },
}

const props = defineProps({
  preset: { type: String, default: 'grade' },
  step: { type: Number, default: 0 },
  reveal: { type: Boolean, default: false },
})

const data = computed(() => PRESETS[props.preset] || PRESETS.grade)
const applied = computed(() => data.value.tests.slice(0, props.step))
const covered = computed(() => {
  const s = new Set()
  if (props.step >= 1) s.add(1)
  applied.value.forEach((t) => t.covers.forEach((l) => s.add(l)))
  return s
})
const percent = computed(() => Math.round((covered.value.size / data.value.code.length) * 100))
const checks = computed(() => applied.value.reduce((a, t) => a + t.asserts, 0))
const state = (i) => (props.step < 1 ? '' : covered.value.has(i + 1) ? 'hit' : 'miss')
</script>

<template>
  <div class="cov">
    <div class="code">
      <div v-for="(l, i) in data.code" :key="i" class="line" :class="state(i)">
        <span class="no">{{ i + 1 }}</span><span class="src">{{ l }}</span>
        <span v-if="reveal && preset === 'noassert' && (i === 4 || i === 5)" class="tag">ветки перепутаны</span>
      </div>
    </div>
    <div class="side">
      <div class="tests">
        <div v-for="(t, i) in data.tests" :key="i" class="test" :class="{ on: i < step }">
          <span class="mark">{{ i < step ? '✓' : '○' }}</span> {{ t.name }}
        </div>
      </div>
      <div class="bar"><div class="fill" :style="{ width: percent + '%' }"></div></div>
      <div class="pct">Покрытие строк: <b>{{ step < 1 ? '—' : percent + '%' }}</b></div>
      <div v-if="preset === 'noassert' && step >= 1" class="chk" :class="{ zero: checks === 0 }">
        Проверок возвращаемого значения: {{ checks }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.cov { display: grid; grid-template-columns: 1.3fr 1fr; gap: 1.2em; font-size: 0.7em; margin-top: 0.5em; }
.code { background: #1e1e2e; color: #cdd6f4; border-radius: 0.4em; padding: 0.5em 0.4em; font-family: monospace; }
.line { display: flex; gap: 0.6em; padding: 0.12em 0.4em; border-left: 4px solid transparent; white-space: pre; align-items: center; }
.line.hit { background: rgba(34, 197, 94, 0.2); border-left-color: #22c55e; }
.line.miss { background: rgba(239, 68, 68, 0.25); border-left-color: #ef4444; }
.no { opacity: 0.5; width: 1.2em; text-align: right; flex: none; }
.tag { margin-left: auto; font-family: sans-serif; font-size: 0.75em; background: #ef4444; color: #fff; padding: 0 0.5em; border-radius: 0.3em; }
.test { opacity: 0.55; margin-bottom: 0.3em; }
.test.on { opacity: 1; }
.mark { color: #22c55e; display: inline-block; width: 1.2em; }
.bar { height: 0.8em; background: rgba(128, 128, 128, 0.3); border-radius: 0.4em; overflow: hidden; margin-top: 0.8em; }
.fill { height: 100%; background: #22c55e; transition: width 0.3s; }
.pct { margin-top: 0.4em; }
.chk { margin-top: 0.5em; color: #22c55e; }
.chk.zero { color: #ef4444; font-weight: 700; }
</style>
