<script setup>
import { computed } from 'vue'

const props = defineProps({
  step: { type: Number, default: 0 },
  modules: { type: Array, default: () => [['A1', 'A2'], ['B1', 'B2']] },
})

const scopes = [
  { id: 'function', title: 'scope="function"' },
  { id: 'module', title: 'scope="module"' },
  { id: 'session', title: 'scope="session"' },
]

const seq = (id) => {
  const out = []
  const all = props.modules.flat()
  if (id === 'function') {
    all.forEach((t) => out.push({ k: 'setup' }, { k: 'test', t }, { k: 'down' }))
  } else if (id === 'module') {
    props.modules.forEach((m, mi) => {
      if (mi) out.push({ k: 'sep' })
      out.push({ k: 'setup' }, ...m.map((t) => ({ k: 'test', t })), { k: 'down' })
    })
  } else {
    out.push({ k: 'setup' }, ...all.map((t) => ({ k: 'test', t })), { k: 'down' })
  }
  return out
}
const count = (id) => seq(id).filter((x) => x.k === 'setup').length
const visible = computed(() => scopes.filter((_, i) => props.step >= i + 1))
</script>

<template>
  <div class="fx">
    <div class="legend">
      <span class="chip setup">▲ подготовка</span><span class="chip down">▼ очистка</span>
      <span class="chip test">A1 A2 — тесты файла A; B1 B2 — тесты файла B</span>
    </div>
    <div v-for="s in visible" :key="s.id" class="lane">
      <div class="title"><code>{{ s.title }}</code> — подготовка выполняется <b>{{ count(s.id) }}</b> {{ count(s.id) === 1 ? 'раз' : count(s.id) < 5 ? 'раза' : 'раз' }}</div>
      <div class="row">
        <template v-for="(x, i) in seq(s.id)" :key="i">
          <span v-if="x.k === 'setup'" class="chip setup">▲</span>
          <span v-else-if="x.k === 'down'" class="chip down">▼</span>
          <span v-else-if="x.k === 'sep'" class="sep"></span>
          <span v-else class="chip test">{{ x.t }}</span>
        </template>
      </div>
    </div>
    <div v-if="step < 1" class="muted">Четыре теста в двух файлах. Область видимости определяет, как часто выполняется подготовка.</div>
  </div>
</template>

<style scoped>
.fx { font-size: 0.75em; margin-top: 0.5em; display: flex; flex-direction: column; gap: 0.8em; }
.legend { display: flex; gap: 0.5em; flex-wrap: wrap; opacity: 0.9; }
.row { display: flex; gap: 0.3em; align-items: center; flex-wrap: wrap; margin-top: 0.3em; }
.chip { padding: 0.1em 0.6em; border-radius: 0.4em; font-family: monospace; }
.chip.setup { background: rgba(34, 197, 94, 0.3); border: 1px solid #22c55e; }
.chip.down { background: rgba(239, 68, 68, 0.3); border: 1px solid #ef4444; }
.chip.test { background: rgba(128, 128, 128, 0.25); border: 1px solid rgba(128, 128, 128, 0.6); }
.sep { width: 3px; height: 1.6em; background: rgba(128, 128, 128, 0.7); margin: 0 0.3em; }
.muted { opacity: 0.6; }
</style>
