import type { PipelineDocument } from '../types'
import { getApiBase } from './client'

export async function loadPipeline(name = 'default'): Promise<PipelineDocument | null> {
  const response = await fetch(`${getApiBase()}/pipeline/${name}`)
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Load failed: ${response.status}`)
  return response.json() as Promise<PipelineDocument>
}

export async function savePipeline(document: PipelineDocument): Promise<PipelineDocument> {
  const response = await fetch(`${getApiBase()}/pipeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(document),
  })

  if (!response.ok) throw new Error(`Save failed: ${response.status}`)
  return response.json() as Promise<PipelineDocument>
}
