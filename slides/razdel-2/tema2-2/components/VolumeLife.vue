<script setup>
import { computed } from 'vue'

const props = defineProps({ step: { type: Number, default: 0 } })
const notes = [
  'Два сценария. Сверху файл пишется в слой контейнера, снизу в том notes.',
  'Первый контейнер записывает заметку.',
  'Контейнер удаляют. Вместе с ним удаляется и его слой записи.',
  'Новый контейнер читает файл. В первом сценарии файла уже нет, во втором он лежит в томе.',
]
const note = computed(() => notes[Math.min(props.step, notes.length - 1)])
const lanes = [
  { title: 'Без тома', vol: false, path: '/notes.txt' },
  { title: 'С томом -v notes:/data', vol: true, path: '/data/notes.txt' },
]
</script>

<template>
  <div class="vl">
    <div v-for="l in lanes" :key="l.title" class="lane">
      <div class="title">{{ l.title }}</div>
      <div class="flow">
        <div class="ctr" :class="{ gone: step >= 2 }">
          <div class="cap">контейнер 1</div>
          <div v-if="!l.vol && step >= 1" class="file">{{ l.path }}</div>
          <div v-if="l.vol && step >= 1" class="mount">{{ l.path }} → том</div>
        </div>
        <div class="arrow">→</div>
        <div class="ctr" :class="{ show: step >= 3 }">
          <div class="cap">контейнер 2</div>
          <div v-if="step >= 3" class="read" :class="l.vol ? 'ok' : 'bad'">
            {{ l.vol ? 'cat → заметка' : 'cat: No such file or directory' }}
          </div>
        </div>
        <div v-if="l.vol" class="volume" :class="{ on: step >= 1 }">
          <div class="cap">том notes</div>
          <div v-if="step >= 1" class="file">notes.txt</div>
        </div>
      </div>
    </div>
    <div class="note">{{ note }}</div>
  </div>
</template>

<style scoped>
.vl { display: flex; flex-direction: column; gap: 0.6em; font-size: 0.72em; margin-top: 0.4em; }
.title { font-weight: 700; margin-bottom: 0.3em; font-family: monospace; }
.flow { display: grid; grid-template-columns: 1fr auto 1fr 0.9fr; gap: 0.6em; align-items: stretch; }
.ctr { border: 2px solid #3b82f6; border-radius: 0.5em; padding: 0.4em 0.6em; min-height: 3.6em; transition: all 0.3s; }
.ctr.gone { opacity: 0.25; border-style: dashed; }
.ctr:not(.gone):nth-child(3) { opacity: 0.35; }
.ctr.show { opacity: 1 !important; }
.cap { font-size: 0.85em; opacity: 0.75; margin-bottom: 0.25em; }
.file, .mount, .read { font-family: monospace; padding: 0.15em 0.4em; border-radius: 0.3em; background: rgba(168, 85, 247, 0.2); display: inline-block; }
.mount { background: rgba(59, 130, 246, 0.2); }
.read.ok { background: rgba(34, 197, 94, 0.25); }
.read.bad { background: rgba(239, 68, 68, 0.25); }
.arrow { align-self: center; font-size: 1.3em; opacity: 0.6; }
.volume { border: 2px solid rgba(128, 128, 128, 0.5); border-radius: 0.5em 0.5em 1.2em 1.2em; padding: 0.4em 0.6em; transition: all 0.3s; }
.volume.on { border-color: #a855f7; }
.note { padding: 0.4em 0.8em; border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); border-radius: 0.2em; }
</style>
