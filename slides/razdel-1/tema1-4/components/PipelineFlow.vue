<script setup>
import { computed } from 'vue'

const props = defineProps({
  step: { type: Number, default: 0 },
  stages: { type: Array, default: () => ['range(1, 5)', 'filter: чётные', 'map: ×10', 'вывод'] },
  items: {
    type: Array,
    default: () => [
      { v: 1, reach: 1, out: null },
      { v: 2, reach: 3, out: 20 },
      { v: 3, reach: 1, out: null },
      { v: 4, reach: 3, out: 40 },
    ],
  },
})

const cur = computed(() => (props.step >= 1 ? props.items[Math.min(props.step, props.items.length) - 1] : null))
const results = computed(() =>
  props.items.slice(0, props.step).filter((it) => it.out !== null).map((it) => it.out),
)
const dropped = computed(() => props.items.slice(0, props.step).filter((it) => it.out === null).map((it) => it.v))
</script>

<template>
  <div class="pipe">
    <div class="stages">
      <template v-for="(s, i) in stages" :key="i">
        <div class="stage" :class="{ lit: cur && i <= cur.reach }">
          <div class="name">{{ s }}</div>
          <div class="slot">
            <span v-if="cur && i === cur.reach" class="token" :class="cur.out === null ? 'drop' : 'ok'">
              {{ cur.out === null ? cur.v + ' ✕' : cur.out }}
            </span>
          </div>
        </div>
        <div v-if="i < stages.length - 1" class="arrow" :class="{ lit: cur && i < cur.reach }">→</div>
      </template>
    </div>
    <div class="caption">
      <template v-if="!cur">Источник ещё не запрашивали: ни один элемент не создан</template>
      <template v-else-if="cur.out === null">Элемент {{ cur.v }} отброшен на стадии фильтра, дальше он не идёт</template>
      <template v-else>Элемент {{ cur.v }} прошёл все стадии, на выходе {{ cur.out }}</template>
    </div>
    <div class="sum">
      <div>Результаты: <b>{{ results.length ? results.join(', ') : '—' }}</b></div>
      <div>Отброшены: <b>{{ dropped.length ? dropped.join(', ') : '—' }}</b></div>
    </div>
  </div>
</template>

<style scoped>
.pipe { font-size: 0.78em; margin-top: 0.6em; }
.stages { display: flex; align-items: center; gap: 0.4em; }
.stage {
  flex: 1; text-align: center; border: 2px solid rgba(128, 128, 128, 0.5); border-radius: 0.5em;
  padding: 0.4em 0.3em; opacity: 0.55; transition: all 0.25s;
}
.stage.lit { opacity: 1; border-color: #3b82f6; background: rgba(59, 130, 246, 0.12); }
.name { font-family: monospace; font-size: 0.85em; }
.slot { height: 1.8em; margin-top: 0.3em; }
.token { display: inline-block; padding: 0 0.6em; border-radius: 1em; font-family: monospace; font-weight: 700; }
.token.ok { background: rgba(34, 197, 94, 0.3); border: 1px solid #22c55e; }
.token.drop { background: rgba(239, 68, 68, 0.3); border: 1px solid #ef4444; }
.arrow { opacity: 0.4; font-size: 1.3em; }
.arrow.lit { opacity: 1; color: #3b82f6; }
.caption { margin-top: 0.8em; padding: 0.4em 0.8em; border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); }
.sum { margin-top: 0.6em; display: flex; gap: 2em; opacity: 0.9; }
</style>
