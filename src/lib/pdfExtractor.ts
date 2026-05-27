import * as pdfjs from 'pdfjs-dist'
import { extractPdfViaScraperApi } from './scraperApi'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export interface PDFExtractionResult {
  text: string
  pageCount: number
  wordCount: number
  success: boolean
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function cleanPdfText(text: string): string {
  return text
    .replace(/\f/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

async function extractWithPdfJs(file: File): Promise<PDFExtractionResult> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: buffer }).promise
  const parts: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    parts.push(pageText)
  }

  const text = cleanPdfText(parts.join('\n\n'))
  if (text.length < 20) {
    throw new Error(
      'Could not extract text from this PDF. It may be scanned/image-only — paste your resume manually.'
    )
  }

  return {
    text,
    pageCount: pdf.numPages,
    wordCount: countWords(text),
    success: true,
  }
}

export async function extractTextFromPDF(
  file: File
): Promise<PDFExtractionResult> {
  if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Please upload a PDF file only')
  }

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('PDF file is too large. Maximum size is 10MB')
  }

  const apiResult = await extractPdfViaScraperApi(file)
  if (apiResult?.text && apiResult.text.length >= 20) {
    return apiResult
  }

  try {
    return await extractWithPdfJs(file)
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Could not extract')) {
      throw error
    }
    throw new Error(
      'Failed to read PDF. Start the scraper with `npm run dev:full` or paste your resume text manually.'
    )
  }
}
