<script setup>
// Число из реального прогона: время шага (sec) или размер образа (size)
import { computed } from 'vue'
import { sec, imageSize, formatBytes, steps, lsColumns, dockerSizeText } from './dockerData.js'

const props = defineProps({
  k: { type: String, default: '' },
  size: { type: String, default: '' },   // тег образа: шаг size_<тег>
  bytes: { type: String, default: '' },  // ключ шага, вывод которого — число байт
  ls: { type: String, default: '' },     // тег образа в выводе docker image ls
  col: { type: String, default: 'disk' }, // disk или content
  digits: { type: Number, default: 1 },
})

const text = computed(() => {
  if (props.ls) {
    const c = lsColumns(props.ls)
    return (c && dockerSizeText(c[props.col])) || '…'
  }
  if (props.bytes) {
    const s = steps[props.bytes]
    const n = s && s.rc === 0 ? parseInt(s.out[0], 10) : NaN
    return Number.isFinite(n) ? formatBytes(n) : '…'
  }
  if (props.size) {
    const b = imageSize(props.size)
    return b === null ? '…' : formatBytes(b)
  }
  const s = sec(props.k, props.digits)
  return s === null ? '…' : s + ' с'
})
</script>

<template>
  <span class="num" :class="{ wait: text === '…' }">{{ text }}</span>
</template>

<style scoped>
.num { font-weight: 700; white-space: nowrap; }
.wait { opacity: 0.5; }
</style>
