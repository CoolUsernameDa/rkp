<script setup>
import { computed } from 'vue'

const props = defineProps({
  seq: { type: String, default: 'AAABBBAA' },
  step: { type: Number, default: 0 },
})

const runsOf = (s) => {
  const runs = []
  for (const ch of s) {
    const last = runs[runs.length - 1]
    if (last && last.key === ch) last.n += 1
    else runs.push({ key: ch, n: 1 })
  }
  return runs
}
const sortedSeq = computed(() => [...props.seq].sort().join(''))
const raw = computed(() => runsOf(props.seq))
const sorted = computed(() => runsOf(sortedSeq.value))
const fmt = (runs) => runs.map((r) => `('${r.key}', ${r.n})`).join('  ')
const color = (ch) => (ch === 'A' ? 'a' : 'b')
</script>

<template>
  <div class="gb">
    <div class="block">
      <div class="cap"><code>groupby("{{ seq }}")</code></div>
      <div class="chips">
        <template v-for="(r, gi) in raw" :key="gi">
          <div class="grp" :class="{ boxed: step >= 1 }">
            <span v-for="k in r.n" :key="k" class="chip" :class="color(r.key)">{{ r.key }}</span>
          </div>
        </template>
      </div>
      <div v-if="step >= 1" class="res">{{ fmt(raw) }} — групп: {{ raw.length }}</div>
    </div>
    <div v-if="step >= 2" class="block">
      <div class="cap"><code>groupby(sorted("{{ seq }}"))</code></div>
      <div class="chips">
        <template v-for="(r, gi) in sorted" :key="gi">
          <div class="grp boxed">
            <span v-for="k in r.n" :key="k" class="chip" :class="color(r.key)">{{ r.key }}</span>
          </div>
        </template>
      </div>
      <div class="res ok">{{ fmt(sorted) }} — групп: {{ sorted.length }}</div>
    </div>
  </div>
</template>

<style scoped>
.gb { font-size: 0.8em; display: flex; flex-direction: column; gap: 1em; margin-top: 0.6em; }
.cap { opacity: 0.8; margin-bottom: 0.3em; }
.chips { display: flex; gap: 0.5em; }
.grp { display: flex; gap: 0.2em; padding: 0.25em; border: 2px solid transparent; border-radius: 0.5em; transition: all 0.25s; }
.grp.boxed { border-color: rgba(128, 128, 128, 0.7); }
.chip { width: 1.7em; height: 1.7em; display: flex; align-items: center; justify-content: center; border-radius: 0.3em; font-family: monospace; font-weight: 700; }
.chip.a { background: rgba(59, 130, 246, 0.35); }
.chip.b { background: rgba(249, 115, 22, 0.4); }
.res { margin-top: 0.4em; font-family: monospace; color: #ef4444; }
.res.ok { color: #22c55e; }
</style>
