<script setup>
import { computed } from 'vue'

// Каждый шаг — снимок состояния цикла событий
const PRESETS = {
  timers: {
    code: [
      'async def say(name, delay):',
      '    print("старт", name)',
      '    await asyncio.sleep(delay)',
      '    print("готово", name)',
      '',
      'await asyncio.gather(say("A", 1), say("B", 0.5))',
    ],
    steps: [
      { t: '0.0', ready: ['A', 'B'], run: null, wait: [], line: 5, note: 'gather создал две задачи и поставил их в очередь готовых.' },
      { t: '0.0', ready: ['B'], run: 'A', wait: [], line: 1, out: 'старт A', note: 'Цикл запускает A. Она печатает строку и доходит до await.' },
      { t: '0.0', ready: ['B'], run: null, wait: [['A', 'таймер 1.0 с']], line: 2, note: 'A приостановлена: заведён таймер, управление вернулось циклу.' },
      { t: '0.0', ready: [], run: 'B', wait: [['A', 'таймер 1.0 с']], line: 1, out: 'старт B', note: 'Цикл берёт следующую готовую задачу — B.' },
      { t: '0.0', ready: [], run: null, wait: [['A', 'таймер 1.0 с'], ['B', 'таймер 0.5 с']], line: 2, note: 'Готовых задач нет. Цикл спит до ближайшего таймера и процессор не занимает.' },
      { t: '0.5', ready: ['B'], run: null, wait: [['A', 'таймер 1.0 с']], line: null, note: 'Сработал таймер B: задача снова в очереди готовых.' },
      { t: '0.5', ready: [], run: 'B', wait: [['A', 'таймер 1.0 с']], line: 3, out: 'готово B', note: 'B продолжает работу со строки после await и завершается.' },
      { t: '1.0', ready: ['A'], run: null, wait: [], line: null, note: 'Сработал таймер A.' },
      { t: '1.0', ready: [], run: 'A', wait: [], line: 3, out: 'готово A', note: 'A завершилась. Обе задачи готовы, gather возвращает результат.' },
    ],
  },
  network: {
    code: [
      'async def fetch(client, url):',
      '    response = await client.get(url)',
      '    print(url, "получен")',
      '',
      'await asyncio.gather(fetch(c, "/a"), fetch(c, "/b"))',
    ],
    steps: [
      { t: null, ready: ['/a', '/b'], run: null, wait: [], line: 4, note: 'Две задачи в очереди готовых.' },
      { t: null, ready: ['/b'], run: '/a', wait: [], line: 1, note: 'Задача /a отправляет запрос в сокет и доходит до await.' },
      { t: null, ready: ['/b'], run: null, wait: [['/a', 'сокет 1: ждём ответ']], line: 1, note: 'Ответа ещё нет: задача /a ждёт сокет, цикл свободен.' },
      { t: null, ready: [], run: '/b', wait: [['/a', 'сокет 1: ждём ответ']], line: 1, note: 'Задача /b отправляет свой запрос.' },
      { t: null, ready: [], run: null, wait: [['/a', 'сокет 1: ждём ответ'], ['/b', 'сокет 2: ждём ответ']], line: 1, os: 'select / epoll: какие сокеты готовы?', note: 'Цикл передаёт список сокетов операционной системе и ждёт, пока какой-нибудь из них получит данные.' },
      { t: null, ready: ['/b'], run: null, wait: [['/a', 'сокет 1: ждём ответ']], line: null, os: 'ОС: данные пришли в сокет 2', note: 'Первым ответил сервер для /b. Порядок ответов определяет сеть.' },
      { t: null, ready: [], run: '/b', wait: [['/a', 'сокет 1: ждём ответ']], line: 2, out: '/b получен', note: '/b продолжает со строки после await.' },
      { t: null, ready: ['/a'], run: null, wait: [], line: null, os: 'ОС: данные пришли в сокет 1', note: 'Ответ для /a.' },
      { t: null, ready: [], run: '/a', wait: [], line: 2, out: '/a получен', note: 'Обе задачи завершены. Всё ожидание шло одновременно.' },
    ],
  },
}

const props = defineProps({
  preset: { type: String, default: 'timers' },
  step: { type: Number, default: 0 },
})

const data = computed(() => PRESETS[props.preset] || PRESETS.timers)
const idx = computed(() => Math.max(0, Math.min(props.step, data.value.steps.length - 1)))
const s = computed(() => data.value.steps[idx.value])
const outs = computed(() => data.value.steps.slice(0, idx.value + 1).filter((x) => x.out).map((x) => x.out))
</script>

<template>
  <div class="loop">
    <div class="code">
      <div v-for="(l, i) in data.code" :key="i" class="line" :class="{ on: s.line === i }">{{ l || ' ' }}</div>
    </div>
    <div class="board">
      <div v-if="s.t !== null" class="clock">время: {{ s.t }} с</div>
      <div v-else class="clock">ожидание сети</div>
      <div class="cols">
        <div class="col">
          <div class="cap">Готовы к запуску</div>
          <div class="chips">
            <span v-for="r in s.ready" :key="r" class="chip ready">{{ r }}</span>
            <span v-if="!s.ready.length" class="muted">—</span>
          </div>
        </div>
        <div class="col">
          <div class="cap">Выполняется</div>
          <div class="chips">
            <span v-if="s.run" class="chip run">{{ s.run }}</span>
            <span v-else class="muted">цикл ждёт</span>
          </div>
        </div>
        <div class="col">
          <div class="cap">Ждут</div>
          <div class="chips col-chips">
            <span v-for="w in s.wait" :key="w[0]" class="chip wait">{{ w[0] }} <small>{{ w[1] }}</small></span>
            <span v-if="!s.wait.length" class="muted">—</span>
          </div>
        </div>
      </div>
      <div v-if="s.os" class="os">{{ s.os }}</div>
      <div class="out">
        <span class="cap">Вывод:</span>
        <span v-for="(o, i) in outs" :key="i" class="mono">{{ o }}</span>
        <span v-if="!outs.length" class="muted">пусто</span>
      </div>
    </div>
    <div class="note">{{ s.note }}</div>
  </div>
</template>

<style scoped>
.loop { display: grid; grid-template-columns: 1fr 1.25fr; gap: 0.7em 1em; font-size: 0.66em; margin-top: 0.4em; }
.code { background: #1e1e2e; color: #cdd6f4; border-radius: 0.4em; padding: 0.5em 0.4em; font-family: monospace; font-size: 0.92em; }
.line { white-space: pre; padding: 0.1em 0.4em; border-radius: 0.25em; }
.line.on { background: rgba(59, 130, 246, 0.4); }
.board { display: flex; flex-direction: column; gap: 0.5em; }
.clock { font-family: monospace; font-weight: 700; color: #3b82f6; }
.cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5em; }
.col { border: 1px solid rgba(128, 128, 128, 0.5); border-radius: 0.4em; padding: 0.35em 0.5em; min-height: 3.6em; }
.cap { font-size: 0.8em; opacity: 0.65; margin-bottom: 0.25em; }
.chips { display: flex; flex-wrap: wrap; gap: 0.3em; }
.col-chips { flex-direction: column; align-items: flex-start; }
.chip { font-family: monospace; border-radius: 0.3em; padding: 0.05em 0.5em; border: 1px solid; transition: all 0.25s; }
.chip small { font-family: sans-serif; opacity: 0.8; margin-left: 0.3em; }
.chip.ready { background: rgba(59, 130, 246, 0.2); border-color: #3b82f6; }
.chip.run { background: rgba(34, 197, 94, 0.3); border-color: #22c55e; font-weight: 700; }
.chip.wait { background: rgba(249, 115, 22, 0.2); border-color: #f97316; }
.os { font-family: monospace; padding: 0.2em 0.6em; border: 1px dashed #a855f7; border-radius: 0.3em; color: #a855f7; }
.out { display: flex; flex-wrap: wrap; gap: 0.6em; align-items: baseline; }
.mono { font-family: monospace; background: rgba(128, 128, 128, 0.15); padding: 0 0.4em; border-radius: 0.2em; }
.muted { opacity: 0.45; }
.note { grid-column: 1 / -1; padding: 0.35em 0.8em; border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); border-radius: 0.2em; }
</style>
