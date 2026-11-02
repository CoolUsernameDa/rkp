<script setup>
import { computed } from 'vue'
import { steps, pending } from './dockerData.js'

const props = defineProps({
  k: { type: String, required: true },      // ключ шага или несколько через запятую
  cmd: { type: String, default: '' },       // команда для заглушки
  match: { type: String, default: '' },     // показывать только строки, подходящие под регулярное выражение
  after: { type: String, default: '' },     // показывать строки, идущие сразу после подходящей
  max: { type: Number, default: 0 },        // ограничить число строк каждого шага
  trim: { type: Number, default: 0 },       // обрезать длинные строки
  small: { type: Boolean, default: false },
  tiny: { type: Boolean, default: false },
  dedupe: { type: Boolean, default: false },  // убрать повторы строк прогресса
  noCmd: { type: Boolean, default: false },
  label: { type: String, default: '' },     // подпись вместо команды, когда запрос выполнял скрипт
})

const blocks = computed(() =>
  props.k.split(',').map((key) => key.trim()).map((key, i) => {
    const s = steps[key]
    const cmds = props.cmd ? props.cmd.split('||') : []
    if (!s) return { cmd: (cmds[i] || key).trim(), lines: ['… вывод появится после запуска collect.py'], wait: true }
    let lines = s.out.filter((l) => l.trim() !== '')
    if (props.after) {
      const rx = new RegExp(props.after)
      lines = lines.filter((l, i, all) => i > 0 && rx.test(all[i - 1]))
    }
    if (props.match) {
      const rx = new RegExp(props.match)
      lines = lines.filter((l) => rx.test(l))
    }
    if (props.dedupe) lines = lines.filter((l, i) => lines.indexOf(l) === i)
    if (props.max && lines.length > props.max) lines = [...lines.slice(0, props.max), '…']
    if (props.trim) lines = lines.map((l) => (l.length > props.trim ? l.slice(0, props.trim - 1) + '…' : l))
    return { cmd: s.cmd, lines, wait: false }
  }),
)

const kind = (l) => {
  if (/Error|error|refused|No such file|Traceback|reset by peer|not known|" 500 /.test(l)) return 'bad'
  if (/CACHED|Healthy|\(healthy\)|Started|Created|Running|Up |PONG|Посещений|Привет|Hello from Docker|" 200 /.test(l)) return 'ok'
  if (/^#\d+ \[/.test(l)) return 'step'
  if (/^#\d+ (DONE|exporting|naming|resolve)|^#\d+ \[internal\]|^\s*$/.test(l)) return 'dim'
  return ''
}
</script>

<template>
  <div class="term" :class="{ small, tiny }">
    <div v-for="(b, i) in blocks" :key="i" class="block">
      <div v-if="label" class="cmd note"># {{ label }}</div>
      <div v-else-if="!noCmd" class="cmd">$ {{ b.cmd }}</div>
      <div v-for="(l, j) in b.lines" :key="j" class="ln" :class="b.wait ? 'wait' : kind(l)">{{ l }}</div>
    </div>
  </div>
</template>

<style scoped>
.term {
  background: #1e1e2e; color: #cdd6f4; border-radius: 0.5em; padding: 0.6em 0.9em;
  font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace; font-size: 0.56em; line-height: 1.35; margin-top: 0.5em;
  overflow-x: auto; flex-shrink: 0;
}
.term.small { font-size: 0.47em; }
.term.tiny { font-size: 0.41em; }
.block + .block { margin-top: 0.45em; }
.cmd { color: #89b4fa; font-weight: 700; }
.cmd.note { color: #7f849c; font-weight: 400; }
.ln { white-space: pre; }
.ok { color: #a6e3a1; }
.bad { color: #f38ba8; }
.step { color: #f9e2af; }
.dim { color: #7f849c; }
.wait { color: #f9e2af; font-style: italic; }
</style>
