<template>
  <div>
    <div
      @click="store.focusAnnotation(item.annotationId)"
      class="flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors group"
      :class="[
        store.focusedAnnotationId === item.annotationId
          ? 'bg-amber-500/20 text-amber-300'
          : 'hover:bg-gray-800 text-gray-300',
        depth === 0 ? 'font-bold' : '',
        depth === 2 ? 'text-xs' : ''
      ]"
      :style="{ paddingLeft: `${depth * 16 + 8}px` }"
    >
      <svg
        v-if="item.children.length"
        xmlns="http://www.w3.org/2000/svg"
        class="w-3 h-3 shrink-0 transition-transform"
        :class="expanded ? 'rotate-90' : ''"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
        @click.stop="expanded = !expanded"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
      <span v-else class="w-3 shrink-0" />
      <span class="truncate">{{ item.title }}</span>
      <span class="ml-auto text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
        {{ levelLabel }}
      </span>
    </div>

    <div v-if="expanded && item.children.length">
      <ChapterItem
        v-for="child in item.children"
        :key="child.id"
        :item="child"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useOcrStore } from '../store/ocr'
import type { ChapterItem as ChapterItemType } from '../types'

const props = defineProps<{
  item: ChapterItemType
  depth: number
}>()

const store = useOcrStore()
const expanded = ref(true)

const LEVEL_LABELS: Record<number, string> = {
  0: '篇/卷',
  1: '章',
  2: '节',
  3: '段',
}

const levelLabel = computed(() => LEVEL_LABELS[props.item.level] || '')
</script>
