<script setup>
import { computed } from 'vue'

// Стек ожиданий: цикл → задача main → fetch → sleep
const STEPS = [
  { frames: [['main()', 'active']], dir: null, note: 'Цикл запускает задачу main().' },
  { frames: [['main()', 'paused'], ['fetch()', 'active']], dir: 'down', note: 'main выполняет await fetch(): корутина fetch начинает работу внутри той же задачи.' },
  { frames: [['main()', 'paused'], ['fetch()', 'paused'], ['sleep(1)', 'future']], dir: 'down', note: 'fetch выполняет await asyncio.sleep(1). Сон — объект Future, который станет готов через 1 с.' },
  { frames: [['main()', 'paused'], ['fetch()', 'paused'], ['sleep(1)', 'future']], dir: 'up', loopFree: true, note: 'Future не готов. Приостановка поднимается по всей цепочке await до цикла: задача main целиком ждёт, цикл свободен.' },
  { frames: [['main()', 'paused'], ['fetch()', 'active'], ['sleep(1)', 'done']], dir: 'down', note: 'Через 1 с Future готов. Цикл возобновляет задачу, управление спускается обратно в fetch.' },
  { frames: [['main()', 'active'], ['fetch()', 'done']], dir: 'up', note: 'fetch завершилась, её return стал результатом await в main.' },
  { frames: [['main()', 'done']], dir: null, note: 'main завершилась — задача выполнена.' },
]

const props = defineProps({ step: { type: Number, default: 0 } })
const s = computed(() => STEPS[Math.max(0, Math.min(props.step, STEPS.length - 1))])
const label = { active: 'выполняется', paused: 'ждёт await', future: 'не готов', done: 'завершено' }
</script>

<template>
  <div class="chain">
    <div class="stack">
      <div class="loopbox" :class="{ free: s.loopFree }">Цикл событий{{ s.loopFree ? ' — свободен' : '' }}</div>
      <div v-for="(f, i) in s.frames" :key="f[0]" class="frame" :class="f[1]" :style="{ marginLeft: (i + 1) * 1.6 + 'em' }">
        <span class="arrow">{{ i === 0 ? '└ задача' : '└ await' }}</span>
        <code>{{ f[0] }}</code>
        <span class="state">{{ label[f[1]] }}</span>
      </div>
    </div>
    <div class="side">
      <div class="dir" :class="s.dir">
        <template v-if="s.dir === 'down'">▼ управление идёт вглубь</template>
        <template v-else-if="s.dir === 'up'">▲ управление возвращается вверх</template>
        <template v-else>&nbsp;</template>
      </div>
      <div class="note">{{ s.note }}</div>
    </div>
  </div>
</template>

<style scoped>
.chain { display: grid; grid-template-columns: 1.1fr 1fr; gap: 1.2em; font-size: 0.72em; margin-top: 0.6em; align-items: start; }
.stack { display: flex; flex-direction: column; gap: 0.45em; }
.loopbox { padding: 0.45em 0.8em; border-radius: 0.4em; background: rgba(128, 128, 128, 0.18); border: 2px solid rgba(128, 128, 128, 0.6); font-weight: 700; transition: all 0.25s; }
.loopbox.free { border-color: #22c55e; background: rgba(34, 197, 94, 0.18); }
.frame { display: flex; align-items: center; gap: 0.6em; padding: 0.35em 0.7em; border-radius: 0.4em; border: 2px solid; transition: all 0.25s; }
.frame code { font-weight: 700; }
.arrow { opacity: 0.55; font-family: monospace; }
.state { margin-left: auto; font-size: 0.85em; }
.frame.active { border-color: #22c55e; background: rgba(34, 197, 94, 0.2); }
.frame.paused { border-color: #f97316; background: rgba(249, 115, 22, 0.15); }
.frame.future { border-color: #a855f7; background: rgba(168, 85, 247, 0.15); border-style: dashed; }
.frame.done { border-color: rgba(128, 128, 128, 0.5); opacity: 0.5; }
.dir { font-weight: 700; margin-bottom: 0.6em; min-height: 1.4em; }
.dir.down { color: #3b82f6; }
.dir.up { color: #22c55e; }
.note { padding: 0.5em 0.8em; border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); border-radius: 0.2em; }
</style>
