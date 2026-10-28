<script setup>
import { computed } from 'vue'

const STEPS = [
  { at: 0, caller: 'await wait_for(slow(), timeout=0.5)', inner: 'await asyncio.sleep(2)', note: 'wait_for запускает slow() и ставит таймер на 0.5 с. slow собирается ждать 2 с.' },
  { at: 0.5, caller: 'ждёт', inner: 'CancelledError', cut: true, note: 'Через 0.5 с срабатывает таймер: внутри slow() на месте await поднимается CancelledError. Блоки finally и except CancelledError успевают освободить ресурсы.' },
  { at: 0.5, caller: 'TimeoutError', inner: 'отменена', cut: true, raised: true, note: 'После отмены wait_for поднимает TimeoutError в вызывающем коде. Остаток работы slow() не выполняется.' },
]
const props = defineProps({ step: { type: Number, default: 0 } })
const s = computed(() => STEPS[Math.max(0, Math.min(props.step, STEPS.length - 1))])
const pct = (v) => (v / 2) * 100 + '%'
</script>

<template>
  <div class="to">
    <div class="row">
      <div class="lab">вызывающий код</div>
      <div class="track">
        <div class="seg wait" :style="{ left: 0, width: pct(0.5) }"></div>
        <div v-if="s.raised" class="flag bad" :style="{ left: pct(0.5) }">TimeoutError</div>
      </div>
    </div>
    <div class="row">
      <div class="lab">slow()</div>
      <div class="track">
        <div class="seg plan" :style="{ left: 0, width: pct(2) }"></div>
        <div class="seg wait" :style="{ left: 0, width: s.cut ? pct(0.5) : pct(2) }"></div>
        <div v-if="s.cut" class="flag bad" :style="{ left: pct(0.5) }">CancelledError</div>
      </div>
    </div>
    <div class="row axis">
      <div class="lab"></div>
      <div class="track ticks">
        <span v-for="t in [0, 0.5, 1, 1.5, 2]" :key="t" class="tick" :style="{ left: pct(t) }">{{ t }} с</span>
        <div class="deadline" :style="{ left: pct(0.5) }"></div>
      </div>
    </div>
    <div class="now">
      <code>{{ s.caller }}</code>
      <code>{{ s.inner }}</code>
    </div>
    <div class="note">{{ s.note }}</div>
  </div>
</template>

<style scoped>
.to { font-size: 0.76em; margin-top: 0.6em; display: flex; flex-direction: column; gap: 0.4em; }
.row { display: flex; align-items: center; gap: 0.6em; }
.lab { width: 9.5em; white-space: nowrap; text-align: right; font-family: monospace; flex: none; }
.track { position: relative; flex: 1; height: 1.6em; background: rgba(128, 128, 128, 0.12); border-radius: 0.25em; }
.seg { position: absolute; top: 0; height: 100%; border-radius: 0.2em; transition: width 0.3s; }
.seg.wait { background: repeating-linear-gradient(45deg, rgba(249, 115, 22, 0.55) 0 6px, rgba(249, 115, 22, 0.2) 6px 12px); }
.seg.plan { border: 2px dashed rgba(128, 128, 128, 0.6); background: none; box-sizing: border-box; }
.flag { position: absolute; top: 50%; transform: translate(0.4em, -50%); font-family: monospace; font-weight: 700; padding: 0 0.4em; border-radius: 0.3em; white-space: nowrap; }
.flag.bad { background: #ef4444; color: #fff; }
.axis .track { background: none; height: 1.2em; }
.tick { position: absolute; transform: translateX(-50%); font-size: 0.85em; opacity: 0.75; white-space: nowrap; }
.deadline { position: absolute; bottom: 1.2em; width: 2px; height: 5.4em; background: #ef4444; }
.now { display: flex; gap: 1em; padding-left: 10.1em; }
.now code { background: rgba(128, 128, 128, 0.15); padding: 0.1em 0.5em; border-radius: 0.3em; }
.note { padding: 0.4em 0.8em; border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); border-radius: 0.2em; }
</style>
