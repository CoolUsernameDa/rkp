<script setup>
import { computed } from 'vue'

// Semaphore(2), пять загрузок по 1 с — те же моменты, что в реальном прогоне
const STEPS = [
  { t: null, queue: [0, 1, 2, 3, 4], inside: [], done: [], note: 'Пять задач вызвали async with sem. Мест в семафоре два.' },
  { t: '0.0', queue: [2, 3, 4], inside: [0, 1], done: [], note: 'Задачи 0 и 1 занимают места. Остальные ждут у входа.' },
  { t: '1.0', queue: [4], inside: [2, 3], done: [0, 1], note: 'Задачи 0 и 1 вышли из блока with, места заняли 2 и 3.' },
  { t: '2.0', queue: [], inside: [4], done: [0, 1, 2, 3], note: 'Последняя задача входит. Одно место свободно.' },
  { t: '3.0', queue: [], inside: [], done: [0, 1, 2, 3, 4], note: 'Все загрузки завершены за 3.0 с. Одновременно работало не больше двух.' },
]
const props = defineProps({ step: { type: Number, default: 0 }, capacity: { type: Number, default: 2 } })
const s = computed(() => STEPS[Math.max(0, Math.min(props.step, STEPS.length - 1))])
</script>

<template>
  <div class="sem">
    <div class="area">
      <div class="cap">Ждут у входа</div>
      <div class="chips"><span v-for="q in s.queue" :key="q" class="chip q">{{ q }}</span><span v-if="!s.queue.length" class="muted">—</span></div>
    </div>
    <div class="gate">
      <div class="cap">Semaphore({{ capacity }}) <span v-if="s.t" class="clock">{{ s.t }} с</span></div>
      <div class="slots">
        <div v-for="k in capacity" :key="k" class="slot" :class="{ busy: s.inside[k - 1] !== undefined }">
          {{ s.inside[k - 1] !== undefined ? 'загрузка ' + s.inside[k - 1] : 'свободно' }}
        </div>
      </div>
    </div>
    <div class="area">
      <div class="cap">Завершены</div>
      <div class="chips"><span v-for="d in s.done" :key="d" class="chip d">{{ d }}</span><span v-if="!s.done.length" class="muted">—</span></div>
    </div>
    <div class="note">{{ s.note }}</div>
  </div>
</template>

<style scoped>
.sem { display: grid; grid-template-columns: 1fr 1.3fr 1fr; gap: 0.7em 1em; font-size: 0.78em; margin-top: 0.5em; align-items: start; }
.area, .gate { border: 2px solid rgba(128, 128, 128, 0.4); border-radius: 0.5em; padding: 0.5em 0.7em; min-height: 5em; }
.gate { border-color: #3b82f6; }
.cap { font-size: 0.9em; opacity: 0.75; margin-bottom: 0.4em; }
.clock { font-family: monospace; color: #3b82f6; font-weight: 700; margin-left: 0.5em; opacity: 1; }
.chips { display: flex; flex-wrap: wrap; gap: 0.35em; }
.chip { font-family: monospace; border-radius: 0.3em; padding: 0.1em 0.55em; border: 1px solid; }
.chip.q { border-color: #f97316; background: rgba(249, 115, 22, 0.2); }
.chip.d { border-color: rgba(128, 128, 128, 0.6); opacity: 0.6; }
.slots { display: flex; flex-direction: column; gap: 0.4em; }
.slot { padding: 0.35em 0.6em; border-radius: 0.35em; border: 2px dashed rgba(128, 128, 128, 0.5); font-family: monospace; transition: all 0.25s; }
.slot.busy { border-style: solid; border-color: #22c55e; background: rgba(34, 197, 94, 0.2); font-weight: 700; }
.muted { opacity: 0.45; }
.note { grid-column: 1 / -1; padding: 0.4em 0.8em; border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); border-radius: 0.2em; }
</style>
