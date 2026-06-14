export interface OCRResult {
  id: string
  text: string
  bbox: [number, number, number, number]  // x, y, w, h
  confidence: number
  corrected?: string
}

export interface Document {
  id: string
  name: string
  imageUrl: string
  results: OCRResult[]
  annotations: Annotation[]
  createdAt: string
}

export interface Annotation {
  id: string
  type: 'region' | 'character' | 'note' | 'chapter'
  bbox: [number, number, number, number]
  label: string
  content: string
}

export interface ChapterItem {
  id: string
  title: string
  level: number
  annotationId: string
  bbox: [number, number, number, number]
  children: ChapterItem[]
}

export interface VariantChar {
  ancient: string
  modern: string
  frequency: number
}
