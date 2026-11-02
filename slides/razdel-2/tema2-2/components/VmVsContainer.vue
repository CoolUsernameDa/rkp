<script setup>
import { computed } from 'vue'

const props = defineProps({ step: { type: Number, default: 0 } })
const apps = ['A', 'B', 'C']
const notes = [
  'Слева три виртуальные машины, справа три контейнера на одном компьютере.',
  'Каждая виртуальная машина загружает собственную операционную систему со своим ядром. Три приложения означают три копии ОС в памяти.',
  'Контейнеры используют ядро операционной системы хоста. Внутри контейнера лежат только библиотеки и само приложение.',
  'Поэтому контейнер запускается как обычный процесс и весит десятки или сотни мегабайт. Виртуальная машина сначала загружает целую ОС.',
]
const note = computed(() => notes[Math.min(props.step, notes.length - 1)])
</script>

<template>
  <div class="vc">
    <div class="side">
      <div class="title">Виртуальные машины</div>
      <div class="cols">
        <div v-for="a in apps" :key="a" class="col">
          <div class="blk app">Приложение {{ a }}</div>
          <div class="blk lib">Библиотеки</div>
          <div class="blk guest" :class="{ hot: step === 1 }">Гостевая ОС и ядро</div>
        </div>
      </div>
      <div class="blk wide hyp">Гипервизор</div>
      <div class="blk wide os">ОС хоста</div>
      <div class="blk wide hw">Оборудование</div>
    </div>
    <div class="side">
      <div class="title">Контейнеры</div>
      <div class="cols">
        <div v-for="a in apps" :key="a" class="col">
          <div class="blk app">Приложение {{ a }}</div>
          <div class="blk lib">Библиотеки</div>
          <div class="blk ghost"></div>
        </div>
      </div>
      <div class="blk wide engine">Docker Engine</div>
      <div class="blk wide os" :class="{ good: step >= 2 }">ОС хоста: одно общее ядро Linux</div>
      <div class="blk wide hw">Оборудование</div>
    </div>
    <div class="note">{{ note }}</div>
  </div>
</template>

<style scoped>
.vc { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6em 1.6em; font-size: 0.66em; margin-top: 0.4em; }
.title { font-weight: 700; margin-bottom: 0.35em; }
.cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.35em; margin-bottom: 0.35em; }
.col { display: flex; flex-direction: column; gap: 0.3em; }
.blk { border-radius: 0.35em; padding: 0.35em 0.3em; text-align: center; border: 2px solid transparent; transition: all 0.25s; }
.wide { margin-top: 0.3em; }
.app { background: rgba(59, 130, 246, 0.22); }
.lib { background: rgba(168, 85, 247, 0.18); }
.guest { background: rgba(249, 115, 22, 0.22); }
.guest.hot { border-color: #ef4444; background: rgba(239, 68, 68, 0.25); font-weight: 700; }
.ghost { visibility: hidden; padding: 0.35em; }
.hyp { background: rgba(128, 128, 128, 0.22); }
.engine { background: rgba(34, 197, 94, 0.18); }
.os { background: rgba(128, 128, 128, 0.3); }
.os.good { border-color: #22c55e; background: rgba(34, 197, 94, 0.25); font-weight: 700; }
.hw { background: rgba(128, 128, 128, 0.15); }
.note { grid-column: 1 / -1; padding: 0.4em 0.8em; border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); border-radius: 0.2em; font-size: 1.05em; }
</style>
