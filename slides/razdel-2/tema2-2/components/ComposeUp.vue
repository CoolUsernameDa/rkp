<script setup>
import { computed } from 'vue'

const STEPS = [
  { note: 'docker compose up читает compose.yaml: два сервиса, web и redis, и том redis-data.' },
  { net: true, note: 'Создаётся сеть counter_default. Все сервисы проекта подключаются к ней автоматически.' },
  { net: true, vol: true, note: 'Создаётся том counter_redis-data. Имя проекта берётся из имени папки: counter.' },
  { net: true, vol: true, redis: 'starting', note: 'Запускается контейнер counter-redis-1. Каждые 2 с Docker выполняет в нём redis-cli ping.' },
  { net: true, vol: true, redis: 'healthy', note: 'Redis ответил PONG: состояние healthy. Только теперь выполнено условие depends_on у web.' },
  { net: true, vol: true, redis: 'healthy', web: true, note: 'Запускается counter-web-1. Порт 8080 хоста связан с портом 8000 контейнера.' },
  { net: true, vol: true, redis: 'healthy', web: true, req: true, note: 'Запрос: localhost:8080 → web. Приложение обращается к хосту redis, встроенный DNS Docker возвращает адрес контейнера redis, команда INCR увеличивает счётчик.' },
]
const props = defineProps({ step: { type: Number, default: 0 } })
const s = computed(() => STEPS[Math.min(props.step, STEPS.length - 1)])
</script>

<template>
  <div class="cu">
    <div class="host">
      <div class="cap">Хост</div>
      <div class="pill" :class="{ on: s.req }">curl localhost:8080</div>
      <div v-if="s.req" class="resp">Посещений: 1</div>
    </div>
    <div class="arrow" :class="{ on: s.web }">8080 → 8000</div>
    <div class="net" :class="{ on: s.net }">
      <div class="cap">сеть counter_default</div>
      <div class="svcs">
        <div class="svc" :class="{ on: s.web }">
          <b>web</b>
          <div class="st">{{ s.web ? 'запущен' : 'ждёт redis' }}</div>
          <div v-if="s.req" class="flow">REDIS_HOST=redis → DNS → адрес redis</div>
        </div>
        <div class="dns" :class="{ on: s.req }">⟶ :6379</div>
        <div class="svc" :class="[s.redis]">
          <b>redis</b>
          <div class="st">{{ s.redis === 'healthy' ? 'healthy' : s.redis === 'starting' ? 'health: starting' : 'не создан' }}</div>
          <div v-if="s.req" class="flow">INCR visits → 1</div>
        </div>
      </div>
    </div>
    <div class="vol" :class="{ on: s.vol }">
      <div class="cap">том</div>
      counter_redis-data → /data
    </div>
    <div class="note">{{ s.note }}</div>
  </div>
</template>

<style scoped>
.cu { display: grid; grid-template-columns: 0.9fr auto 2.2fr; grid-template-rows: auto auto auto; gap: 0.6em 0.7em; font-size: 0.7em; margin-top: 0.4em; align-items: center; }
.cap { font-size: 0.85em; opacity: 0.75; margin-bottom: 0.3em; }
.host { border: 2px solid rgba(128, 128, 128, 0.45); border-radius: 0.5em; padding: 0.5em 0.6em; }
.pill { font-family: monospace; padding: 0.25em 0.4em; border-radius: 0.3em; background: rgba(128, 128, 128, 0.15); }
.pill.on { background: rgba(59, 130, 246, 0.25); }
.resp { margin-top: 0.35em; font-family: monospace; color: #22c55e; font-weight: 700; }
.arrow { font-family: monospace; opacity: 0.25; transition: opacity 0.25s; }
.arrow.on { opacity: 1; color: #3b82f6; font-weight: 700; }
.net { border: 2px dashed rgba(128, 128, 128, 0.4); border-radius: 0.6em; padding: 0.5em 0.7em; transition: all 0.25s; opacity: 0.5; }
.net.on { border-color: #a855f7; opacity: 1; }
.svcs { display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.5em; align-items: center; }
.svc { border: 2px solid rgba(128, 128, 128, 0.45); border-radius: 0.5em; padding: 0.45em 0.6em; min-height: 4.2em; transition: all 0.25s; }
.svc.on, .svc.healthy { border-color: #22c55e; background: rgba(34, 197, 94, 0.15); }
.svc.starting { border-color: #f97316; background: rgba(249, 115, 22, 0.15); }
.st { font-family: monospace; font-size: 0.85em; margin-top: 0.2em; }
.flow { font-family: monospace; font-size: 0.8em; margin-top: 0.3em; color: #3b82f6; }
.dns { font-family: monospace; opacity: 0.2; }
.dns.on { opacity: 1; color: #3b82f6; font-weight: 700; }
.vol { grid-column: 3; justify-self: end; width: 55%; font-family: monospace; border: 2px solid rgba(128, 128, 128, 0.4); border-radius: 0.5em 0.5em 1.1em 1.1em; padding: 0.4em 0.6em; opacity: 0.4; transition: all 0.25s; }
.vol.on { opacity: 1; border-color: #a855f7; }
.note { grid-column: 1 / -1; padding: 0.4em 0.8em; border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); border-radius: 0.2em; }
</style>
