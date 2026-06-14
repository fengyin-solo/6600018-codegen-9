import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Document, OCRResult, Annotation, ChapterItem } from '../types'

export const useOcrStore = defineStore('ocr', () => {
  const documents = ref<Document[]>([])
  const currentDoc = ref<Document | null>(null)
  const isLoading = ref(false)
  const searchQuery = ref('')
  const searchResults = ref<OCRResult[]>([])
  const focusedAnnotationId = ref<string | null>(null)

  const MOCK_DOC: Document = {
    id: '1',
    name: '论语·学而篇',
    imageUrl: '',
    results: [
      { id: 'r1', text: '子曰', bbox: [50, 30, 80, 40], confidence: 0.95 },
      { id: 'r2', text: '学而', bbox: [50, 80, 80, 40], confidence: 0.88 },
      { id: 'r3', text: '时习之', bbox: [50, 130, 120, 40], confidence: 0.91 },
      { id: 'r4', text: '不亦说乎', bbox: [50, 180, 160, 40], confidence: 0.87 },
      { id: 'r5', text: '有朋', bbox: [200, 30, 80, 40], confidence: 0.93 },
      { id: 'r6', text: '自远方来', bbox: [200, 80, 160, 40], confidence: 0.85 },
      { id: 'r7', text: '不亦乐乎', bbox: [200, 130, 160, 40], confidence: 0.92 },
    ],
    annotations: [
      { id: 'ch1', type: 'chapter', bbox: [30, 10, 200, 230], label: '章', content: '学而第一' },
      { id: 'ch2', type: 'chapter', bbox: [30, 10, 120, 120], label: '节', content: '学而时习' },
      { id: 'ch3', type: 'chapter', bbox: [30, 130, 200, 110], label: '节', content: '不亦说乎' },
      { id: 'ch4', type: 'chapter', bbox: [180, 10, 200, 170], label: '章', content: '有朋自远方来' },
    ],
    createdAt: '2025-01-15'
  }

  const VARIANT_DICT: Record<string, string> = {
    '説': '说', '學': '学', '習': '习', '遠': '远', '樂': '乐', '書': '书',
    '國': '国', '東': '东', '長': '长', '門': '门', '馬': '马', '鳥': '鸟',
    '風': '风', '雲': '云', '龍': '龙', '車': '车', '萬': '万', '見': '见',
  }

  const LEVEL_MAP: Record<string, number> = {
    '篇': 0, '卷': 0,
    '章': 1,
    '节': 2,
    '段': 3,
  }

  const chapterList = computed<ChapterItem[]>(() => {
    if (!currentDoc.value) return []
    const chapters = currentDoc.value.annotations
      .filter(a => a.type === 'chapter')
      .sort((a, b) => {
        if (a.bbox[1] !== b.bbox[1]) return a.bbox[1] - b.bbox[1]
        return a.bbox[0] - b.bbox[0]
      })

    const items: ChapterItem[] = chapters.map(a => ({
      id: a.id,
      title: a.content || a.label,
      level: LEVEL_MAP[a.label] ?? 1,
      annotationId: a.id,
      bbox: a.bbox,
      children: [],
    }))

    const root: ChapterItem[] = []
    const stack: ChapterItem[] = []

    for (const item of items) {
      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop()
      }
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(item)
      } else {
        root.push(item)
      }
      stack.push(item)
    }

    return root
  })

  function loadMockDocument() {
    documents.value = [MOCK_DOC]
    currentDoc.value = MOCK_DOC
  }

  async function uploadAndOCR(file: File) {
    isLoading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      const resp = await fetch('/api/ocr', { method: 'POST', body: formData })
      if (resp.ok) {
        const data = await resp.json()
        const doc: Document = {
          id: Date.now().toString(),
          name: file.name,
          imageUrl: URL.createObjectURL(file),
          results: data.results || [],
          annotations: [],
          createdAt: new Date().toISOString()
        }
        documents.value.push(doc)
        currentDoc.value = doc
      }
    } catch {
      loadMockDocument()
    } finally {
      isLoading.value = false
    }
  }

  function addAnnotation(type: Annotation['type'], bbox: [number, number, number, number], label: string, content: string) {
    if (!currentDoc.value) return
    currentDoc.value.annotations.push({
      id: Date.now().toString(),
      type, bbox, label, content
    })
  }

  function removeAnnotation(id: string) {
    if (!currentDoc.value) return
    currentDoc.value.annotations = currentDoc.value.annotations.filter(a => a.id !== id)
    if (focusedAnnotationId.value === id) {
      focusedAnnotationId.value = null
    }
  }

  function focusAnnotation(id: string | null) {
    focusedAnnotationId.value = id
  }

  function convertVariant(text: string): string {
    return text.split('').map(c => VARIANT_DICT[c] || c).join('')
  }

  function searchInDocuments(query: string) {
    const q = query.toLowerCase()
    searchResults.value = documents.value.flatMap(d =>
      d.results.filter(r => r.text.includes(q) || (r.corrected || '').includes(q))
    )
  }

  function exportTEI(): string {
    if (!currentDoc.value) return ''
    let tei = '<?xml version="1.0" encoding="UTF-8"?>\n'
    tei += '<TEI xmlns="http://www.tei-c.org/ns/1.0">\n'
    tei += `  <teiHeader><fileDesc><titleStmt><title>${currentDoc.value.name}</title></titleStmt></fileDesc></teiHeader>\n`
    tei += '  <text><body>\n'
    for (const r of currentDoc.value.results) {
      tei += `    <seg type="line" xml:id="${r.id}" cert="${r.confidence}">${r.corrected || r.text}</seg>\n`
    }
    tei += '  </body></text>\n</TEI>'
    return tei
  }

  return {
    documents, currentDoc, isLoading, searchQuery, searchResults,
    focusedAnnotationId, chapterList,
    loadMockDocument, uploadAndOCR, addAnnotation, removeAnnotation,
    focusAnnotation, convertVariant, searchInDocuments, exportTEI
  }
})
