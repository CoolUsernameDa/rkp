<script setup>
import { computed } from 'vue'

const props = defineProps({
  step: { type: Number, default: 0 },
  bad: { type: Boolean, default: false },
})

const server = computed(() => (props.bad ? 'http.server --bind 127.0.0.1' : 'python app.py слушает 0.0.0.0:8000'))
const port = computed(() => (props.bad ? 8081 : 8080))
const notes = computed(() => props.bad
  ? [
      'Сервер запущен командой python -m http.server 8000 --bind 127.0.0.1 и слушает только петлевой интерфейс контейнера.',
      'Запрос с хоста идёт на порт 8081.',
      'Docker пересылает его на порт 8000 сетевого интерфейса контейнера.',
      'На этом интерфейсе порт 8000 никто не слушает, и соединение закрывается без ответа. Внутри контейнера 127.0.0.1 означает сам контейнер.',
    ]
  : [
      'Флаг -p 8080:8000 связывает порт 8080 хоста с портом 8000 контейнера.',
      'Запрос с хоста идёт на localhost:8080.',
      'Docker пересылает его на порт 8000 сетевого интерфейса контейнера.',
      'Сервер слушает 0.0.0.0, то есть все интерфейсы, поэтому принимает запрос и отвечает.',
    ])
const note = computed(() => notes.value[Math.min(props.step, 3)])
const ok = computed(() => props.step >= 3 && !props.bad)
const fail = computed(() => props.step >= 3 && props.bad)
</script>

<template>
  <div class="pm">
    <div class="box host">
      <div class="cap">Хост (компьютер)</div>
      <div class="client" :class="{ on: step >= 1 }">curl http://localhost:{{ port }}</div>
      <div class="port" :class="{ on: step >= 1 }">порт {{ port }}</div>
    </div>
    <div class="link">
      <div class="flag">-p {{ port }}:8000</div>
      <div class="arr" :class="{ on: step >= 2 }">⟶</div>
      <div class="arr back" :class="{ on: ok }">⟵ ответ</div>
    </div>
    <div class="box ctr">
      <div class="cap">Контейнер</div>
      <div class="iface" :class="{ on: step >= 2, bad: fail }">
        сетевой интерфейс, порт 8000
        <span v-if="fail" class="x">никто не слушает</span>
      </div>
      <div class="iface lo">127.0.0.1 (петля внутри контейнера)</div>
      <div class="app" :class="{ ok, bad: fail }">{{ server }}</div>
    </div>
    <div class="note" :class="{ badnote: fail }">{{ note }}</div>
  </div>
</template>

<style scoped>
.pm { display: grid; grid-template-columns: 1fr auto 1.25fr; gap: 0.7em 0.8em; font-size: 0.72em; margin-top: 0.6em; align-items: center; }
.box { border: 2px solid rgba(128, 128, 128, 0.45); border-radius: 0.6em; padding: 0.5em 0.7em; display: flex; flex-direction: column; gap: 0.45em; }
.ctr { border-color: #3b82f6; }
.cap { font-size: 0.85em; opacity: 0.75; }
.client, .port, .iface, .app { font-family: monospace; padding: 0.3em 0.5em; border-radius: 0.35em; background: rgba(128, 128, 128, 0.14); transition: all 0.25s; }
.on { background: rgba(59, 130, 246, 0.25); }
.lo { opacity: 0.7; }
.app.ok { background: rgba(34, 197, 94, 0.28); font-weight: 700; }
.app.bad, .iface.bad { background: rgba(239, 68, 68, 0.25); }
.x { margin-left: 0.5em; color: #ef4444; font-weight: 700; font-family: sans-serif; }
.link { display: flex; flex-direction: column; align-items: center; gap: 0.2em; }
.flag { font-family: monospace; font-weight: 700; color: #3b82f6; }
.arr { font-size: 1.4em; opacity: 0.2; transition: opacity 0.25s; }
.arr.on { opacity: 1; color: #3b82f6; }
.arr.back { font-size: 0.95em; }
.arr.back.on { color: #22c55e; }
.note { grid-column: 1 / -1; padding: 0.4em 0.8em; border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); border-radius: 0.2em; }
.note.badnote { border-left-color: #ef4444; background: rgba(239, 68, 68, 0.1); }
</style>
