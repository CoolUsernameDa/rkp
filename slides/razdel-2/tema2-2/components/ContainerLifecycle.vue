<script setup>
import { computed } from 'vue'

const STATES = [
  { id: 'image', title: 'Образ', status: 'docker images' },
  { id: 'created', title: 'Создан', status: 'Created' },
  { id: 'running', title: 'Работает', status: 'Up …' },
  { id: 'exited', title: 'Остановлен', status: 'Exited (код) …' },
  { id: 'removed', title: 'Удалён', status: 'исчез из ps -a' },
]
const STEPS = [
  { at: 'image', cmd: '', note: 'Образ лежит на диске. Ни одного контейнера из него ещё нет.' },
  { at: 'created', cmd: 'docker create', note: 'Контейнер создан: у него есть имя, слой для записи и настройки. Процесс ещё не запущен.' },
  { at: 'running', cmd: 'docker start', note: 'Процесс запущен. Контейнер живёт, пока работает его главный процесс.' },
  { at: 'exited', cmd: 'процесс завершился или docker stop', note: 'Процесс завершился, контейнер остановлен. Его файлы и логи сохранились, его можно запустить снова.' },
  { at: 'removed', cmd: 'docker rm', note: 'Контейнер удалён вместе со своим слоем записи. Образ остался.' },
  { at: 'run', cmd: 'docker run = create + start', note: 'docker run делает два шага сразу. С флагом --rm контейнер удаляется сам после завершения процесса.' },
]
const props = defineProps({ step: { type: Number, default: 0 } })
const s = computed(() => STEPS[Math.min(props.step, STEPS.length - 1)])
const idx = (id) => STATES.findIndex((x) => x.id === id)
const cls = (st) => {
  if (s.value.at === 'run') return st.id === 'created' || st.id === 'running' ? 'on' : ''
  const cur = idx(s.value.at)
  const i = idx(st.id)
  return i === cur ? 'on' : i < cur ? 'past' : ''
}
</script>

<template>
  <div class="lc">
    <div class="row">
      <template v-for="(st, i) in STATES" :key="st.id">
        <div class="state" :class="cls(st)">
          <div class="name">{{ st.title }}</div>
          <div class="status">{{ st.status }}</div>
        </div>
        <div v-if="i < STATES.length - 1" class="arrow">→</div>
      </template>
    </div>
    <div class="cmd" :class="{ hidden: !s.cmd }">{{ s.cmd || '·' }}</div>
    <div class="note">{{ s.note }}</div>
  </div>
</template>

<style scoped>
.lc { font-size: 0.74em; margin-top: 0.6em; display: flex; flex-direction: column; gap: 0.8em; }
.row { display: flex; align-items: center; gap: 0.4em; }
.state { flex: 1; text-align: center; padding: 0.55em 0.3em; border-radius: 0.5em; border: 2px solid rgba(128, 128, 128, 0.45); opacity: 0.55; transition: all 0.25s; }
.state.past { opacity: 0.8; }
.state.on { opacity: 1; border-color: #22c55e; background: rgba(34, 197, 94, 0.2); }
.name { font-weight: 700; }
.status { font-family: monospace; font-size: 0.8em; opacity: 0.8; margin-top: 0.2em; }
.arrow { opacity: 0.55; font-size: 1.2em; }
.cmd { font-family: monospace; background: #1e1e2e; color: #89b4fa; padding: 0.4em 0.8em; border-radius: 0.4em; }
.cmd.hidden { visibility: hidden; }
.note { padding: 0.4em 0.8em; border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); border-radius: 0.2em; }
</style>
