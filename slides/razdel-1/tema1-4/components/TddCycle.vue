<script setup>
import { computed } from 'vue'

const props = defineProps({ step: { type: Number, default: 0 } })

const phases = [
  { name: 'Красный', color: 'red', text: 'Написать тест для ещё не существующего поведения. Тест падает.' },
  { name: 'Зелёный', color: 'green', text: 'Написать минимальный код, при котором тест проходит. Красота не требуется.' },
  { name: 'Рефакторинг', color: 'blue', text: 'Улучшить код, не меняя поведение. Тесты остаются зелёными.' },
]
const active = computed(() => props.step - 1)
</script>

<template>
  <div class="tdd">
    <div class="phases">
      <template v-for="(p, i) in phases" :key="i">
        <div class="phase" :class="[p.color, { on: active === i }]">{{ i + 1 }}. {{ p.name }}</div>
        <div v-if="i < phases.length - 1" class="arrow">→</div>
      </template>
    </div>
    <div class="back">↺ после рефакторинга — следующий тест</div>
    <div class="desc">{{ active >= 0 && active < 3 ? phases[active].text : 'Цикл повторяется для каждого нового требования.' }}</div>
  </div>
</template>

<style scoped>
.tdd { font-size: 0.8em; margin-top: 0.8em; }
.phases { display: flex; align-items: center; gap: 0.6em; }
.phase { flex: 1; text-align: center; padding: 0.7em 0.3em; border-radius: 0.6em; border: 2px solid; opacity: 0.45; transition: all 0.25s; font-weight: 700; }
.phase.on { opacity: 1; transform: scale(1.05); }
.phase.red { border-color: #ef4444; background: rgba(239, 68, 68, 0.2); }
.phase.green { border-color: #22c55e; background: rgba(34, 197, 94, 0.2); }
.phase.blue { border-color: #3b82f6; background: rgba(59, 130, 246, 0.2); }
.arrow { font-size: 1.4em; opacity: 0.6; }
.back { text-align: center; margin-top: 0.5em; opacity: 0.7; }
.desc { margin-top: 1em; padding: 0.5em 0.9em; border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); min-height: 2.6em; }
</style>
