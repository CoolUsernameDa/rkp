<script setup>
import { computed } from 'vue'
import outputs from './terminalOutputs.js'

const props = defineProps({
  name: { type: String, required: true },
  cmd: { type: String, default: '' },
  compact: { type: Boolean, default: false },
  small: { type: Boolean, default: false },
})

const run = computed(() => outputs[props.name] || { cmd: props.cmd, lines: ['(нет данных)'] })
const shown = computed(() => (props.compact ? run.value.lines.filter((l) => l.trim() !== '') : run.value.lines))

const kind = (l) => {
  if (/PASSED|^=+ .*\bpassed\b.*=+$/.test(l) && !/failed|error/.test(l)) return 'ok'
  if (/FAILED|^E |^>|^_+ .* _+$|^ERROR|^FAIL |failed|error|Interrupted|Coverage failure/.test(l)) return 'bad'
  if (/^SETUP|^TEARDOWN/.test(l.trim())) return 'info'
  if (/^=+ |^-+ |^!+ /.test(l) || /^-{5,}/.test(l)) return 'dim'
  if (/100%/.test(l)) return 'ok'
  return ''
}
</script>

<template>
  <div class="term" :class="{ small }">
    <div class="cmd">$ {{ cmd || run.cmd }}</div>
    <div v-for="(l, i) in shown" :key="i" class="ln" :class="kind(l)">{{ l || ' ' }}</div>
  </div>
</template>

<style scoped>
.term {
  background: #1e1e2e; color: #cdd6f4; border-radius: 0.5em; padding: 0.6em 0.9em;
  font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace; font-size: 0.5em; line-height: 1.3; margin-top: 0.5em;
}
.term.small { font-size: 0.43em; }
.cmd { color: #89b4fa; font-weight: 700; margin-bottom: 0.3em; }
.ln { white-space: pre; }
.ok { color: #a6e3a1; }
.bad { color: #f38ba8; }
.info { color: #f9e2af; }
.dim { color: #7f849c; }
</style>
