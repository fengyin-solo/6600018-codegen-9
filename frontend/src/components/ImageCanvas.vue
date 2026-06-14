<template>
  <div ref="containerRef" class="relative w-full h-full overflow-auto" @mousedown="startDrag" @mousemove="onDrag" @mouseup="endDrag">
    <div ref="contentRef" class="relative" :style="contentStyle">
      <img v-if="store.currentDoc?.imageUrl" :src="store.currentDoc.imageUrl"
        class="absolute inset-0 w-full h-full object-contain" ref="imgRef" />
      <canvas v-else ref="mockCanvas" class="w-full h-full" />

      <svg class="absolute inset-0 w-full h-full pointer-events-none">
        <g v-for="r in store.currentDoc?.results || []" :key="r.id">
          <rect :x="r.bbox[0]" :y="r.bbox[1]" :width="r.bbox[2]" :height="r.bbox[3]"
            fill="none" stroke="rgba(251,191,36,0.6)" stroke-width="2" />
          <text :x="r.bbox[0]" :y="r.bbox[1] - 5" fill="#fbbf24" font-size="12">{{ r.text }}</text>
        </g>
        <g v-for="a in store.currentDoc?.annotations || []" :key="a.id">
          <rect :x="a.bbox[0]" :y="a.bbox[1]" :width="a.bbox[2]" :height="a.bbox[3]"
            :fill="getAnnotationFill(a)"
            :stroke="getAnnotationStroke(a)"
            :stroke-width="store.focusedAnnotationId === a.id ? 3 : 2"
            :stroke-dasharray="a.type === 'chapter' ? '8,4' : '5,5'" />
          <text :x="a.bbox[0]" :y="a.bbox[1] - 5"
            :fill="store.focusedAnnotationId === a.id ? '#fbbf24' : getAnnotationTextColor(a)"
            :font-size="a.type === 'chapter' ? 13 : 11"
            :font-weight="a.type === 'chapter' ? 'bold' : 'normal'">
            {{ a.label }}{{ a.content ? ': ' + a.content : '' }}
          </text>
        </g>
        <rect v-if="dragging" :x="dragRect.x" :y="dragRect.y" :width="dragRect.w" :height="dragRect.h"
          fill="rgba(16,185,129,0.1)" stroke="#10b981" stroke-width="2" stroke-dasharray="4,4" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch, nextTick } from 'vue'
import { useOcrStore } from '../store/ocr'
import type { Annotation } from '../types'

const store = useOcrStore()
const mockCanvas = ref<HTMLCanvasElement | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const dragging = ref(false)
const dragStart = reactive({ x: 0, y: 0 })
const dragRect = reactive({ x: 0, y: 0, w: 0, h: 0 })
const contentStyle = ref<Record<string, string>>({})

onMounted(() => {
  if (mockCanvas.value) {
    const ctx = mockCanvas.value.getContext('2d')!
    const w = mockCanvas.value.width = mockCanvas.value.offsetWidth * 2
    const h = mockCanvas.value.height = mockCanvas.value.offsetHeight * 2

    ctx.fillStyle = '#f5e6c8'
    ctx.fillRect(0, 0, w, h)

    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = `rgba(139,90,43,${Math.random() * 0.1})`
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
    }

    ctx.fillStyle = '#2d1810'
    ctx.font = 'bold 48px serif'
    const columns = [
      ['子', '曰', '學', '而', '時', '習', '之', '不', '亦', '説', '乎'],
      ['有', '朋', '自', '遠', '方', '來', '不', '亦', '樂', '乎'],
      ['人', '不', '知', '而', '不', '慍', '不', '亦', '君', '子', '乎'],
    ]
    columns.forEach((col, ci) => {
      const x = w - 150 - ci * 180
      col.forEach((ch, ri) => {
        ctx.fillText(ch, x, 80 + ri * 65)
      })
    })

    contentStyle.value = {
      width: `${w / 2}px`,
      height: `${h / 2}px`,
    }
  }
})

watch(() => store.focusedAnnotationId, (id) => {
  if (!id || !store.currentDoc || !containerRef.value) return
  const annotation = store.currentDoc.annotations.find(a => a.id === id)
  if (!annotation) return
  const [bx, by, bw, bh] = annotation.bbox
  nextTick(() => {
    const container = containerRef.value
    if (!container) return
    const centerX = bx + bw / 2
    const centerY = by + bh / 2
    container.scrollTo({
      left: centerX - container.clientWidth / 2,
      top: centerY - container.clientHeight / 2,
      behavior: 'smooth',
    })
  })
})

function getAnnotationFill(a: Annotation): string {
  if (store.focusedAnnotationId === a.id) {
    return a.type === 'chapter' ? 'rgba(251,191,36,0.2)' : 'rgba(59,130,246,0.25)'
  }
  return a.type === 'chapter' ? 'rgba(251,191,36,0.08)' : 'rgba(59,130,246,0.15)'
}

function getAnnotationStroke(a: Annotation): string {
  if (store.focusedAnnotationId === a.id) return '#fbbf24'
  return a.type === 'chapter' ? 'rgba(251,191,36,0.6)' : '#3b82f6'
}

function getAnnotationTextColor(a: Annotation): string {
  return a.type === 'chapter' ? '#d97706' : '#3b82f6'
}

function startDrag(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  dragStart.x = e.clientX - rect.left + (containerRef.value?.scrollLeft || 0)
  dragStart.y = e.clientY - rect.top + (containerRef.value?.scrollTop || 0)
  dragging.value = true
}

function onDrag(e: MouseEvent) {
  if (!dragging.value) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const cx = e.clientX - rect.left + (containerRef.value?.scrollLeft || 0)
  const cy = e.clientY - rect.top + (containerRef.value?.scrollTop || 0)
  dragRect.x = Math.min(dragStart.x, cx)
  dragRect.y = Math.min(dragStart.y, cy)
  dragRect.w = Math.abs(cx - dragStart.x)
  dragRect.h = Math.abs(cy - dragStart.y)
}

function endDrag(e: MouseEvent) {
  if (!dragging.value || dragRect.w < 10 || dragRect.h < 10) { dragging.value = false; return }
  dragging.value = false
  const label = prompt('标注标签（篇/章/节/段/区域/异体字）') || 'region'
  const content = prompt('标注内容') || ''
  const isChapter = ['篇', '章', '节', '段', '卷'].includes(label)
  store.addAnnotation(
    isChapter ? 'chapter' : 'region',
    [dragRect.x, dragRect.y, dragRect.w, dragRect.h],
    label,
    content
  )
}
</script>
