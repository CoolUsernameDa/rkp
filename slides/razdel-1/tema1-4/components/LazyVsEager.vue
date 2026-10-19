<script setup>
import { computed } from 'vue'

const props = defineProps({
  n: { type: Number, default: 4 },
  step: { type: Number, default: 0 },
})

const values = computed(() => Array.from({ length: props.n }, (_, i) => (i + 1) * (i + 1)))
const listReady = computed(() => props.step >= 1)
const genPos = computed(() => props.step - 2) // индекс текущего значения генератора
</script>

<template>
  <div class="lazy">
    <div class="lane">
      <div class="label"><code>[x * x for x in range(1, {{ n + 1 }})]</code> — список</div>
      <div class="row">
        <div v-for="(v, i) in values" :key="i" class="cell" :class="{ full: listReady }">{{ listReady ? v : '' }}</div>
      </div>
      <div class="status" :class="{ on: listReady }">
        {{ listReady ? 'В памяти одновременно: все значения списка' : 'Ещё не создан' }}
      </div>
    </div>
    <div class="lane">
      <div class="label"><code>(x * x for x in range(1, {{ n + 1 }}))</code> — генератор</div>
      <div class="row">
        <div v-for="(v, i) in values" :key="i" class="cell" :class="{ full: genPos === i, spent: genPos > i }">
          {{ genPos === i ? v : '' }}
        </div>
      </div>
      <div class="status" :class="{ on: step >= 2 }">
        <template v-if="step < 1">Ещё не создан</template>
        <template v-else-if="step === 1">Создан. Значения ещё не вычислялись</template>
        <template v-else-if="genPos < n">В памяти одновременно: одно текущее значение</template>
        <template v-else>Значения закончились</template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lazy { font-size: 0.8em; display: flex; flex-direction: column; gap: 1em; margin-top: 0.6em; }
.label { margin-bottom: 0.3em; opacity: 0.85; }
.row { display: flex; gap: 0.5em; }
.cell {
  width: 3.4em; height: 2.2em; display: flex; align-items: center; justify-content: center;
  border: 2px dashed rgba(128, 128, 128, 0.5); border-radius: 0.4em; font-family: monospace; transition: all 0.25s;
}
.cell.full { border-style: solid; border-color: #3b82f6; background: rgba(59, 130, 246, 0.25); font-weight: 700; }
.cell.spent { opacity: 0.4; }
.status { margin-top: 0.3em; opacity: 0.6; }
.status.on { opacity: 1; color: #3b82f6; }
</style>
