<template>
  <div class="flex flex-col h-full">
    <h3 class="text-amber-300 font-bold text-sm mb-2 flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h10M4 18h7" />
      </svg>
      章节目录
    </h3>

    <div v-if="store.chapterList.length" class="flex-1 overflow-y-auto space-y-0.5">
      <ChapterItem
        v-for="item in store.chapterList"
        :key="item.id"
        :item="item"
        :depth="0"
      />
    </div>

    <div v-else class="flex-1 flex items-center justify-center">
      <p class="text-gray-600 text-xs text-center leading-5">
        暂无章节标注<br/>在图片上框选区域并标注为<br/>「章」「节」「篇」等即可自动生成目录
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useOcrStore } from '../store/ocr'
import ChapterItem from './ChapterItem.vue'

const store = useOcrStore()
</script>
