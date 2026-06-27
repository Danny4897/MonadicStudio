import { getApiBase } from './client'
import type {
  ExportCodeResponse,
  SolutionDiscoverResponse,
  SolutionSettings,
  SolutionTreeResponse,
} from '../types/solution'
import type { GenerateRequest } from '../types'

export async function fetchSolutionTree(): Promise<SolutionTreeResponse> {
  const response = await fetch(`${getApiBase()}/solution/tree`)
  if (!response.ok) throw new Error(`Solution tree failed: ${response.status}`)
  return response.json() as Promise<SolutionTreeResponse>
}

export async function fetchSolutionConfig(): Promise<SolutionSettings> {
  const res = await fetch(`${getApiBase()}/solution/config`)
  if (!res.ok) throw new Error('Config load failed')
  return res.json() as Promise<SolutionSettings>
}

export async function discoverSolution(directoryPath: string): Promise<SolutionDiscoverResponse> {
  const res = await fetch(`${getApiBase()}/solution/discover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directoryPath }),
  })
  if (!res.ok) throw new Error('Discover failed')
  return res.json() as Promise<SolutionDiscoverResponse>
}

export async function linkSolution(payload: {
  projectPath: string
  outputDirectory?: string
  rootNamespace?: string
  outputFileName?: string
}): Promise<SolutionSettings> {
  const res = await fetch(`${getApiBase()}/solution/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = (await res.json()) as { message?: string }
    throw new Error(err.message ?? 'Link failed')
  }
  return res.json() as Promise<SolutionSettings>
}

export async function exportToSolution(request: GenerateRequest): Promise<ExportCodeResponse> {
  const res = await fetch(`${getApiBase()}/generate/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    const err = (await res.json()) as { message?: string }
    throw new Error(err.message ?? 'Export failed')
  }
  return res.json() as Promise<ExportCodeResponse>
}

export function downloadCsFile(code: string, filename = 'GeneratedPipeline.cs') {
  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
