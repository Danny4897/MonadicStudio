import type { XYPosition } from '@xyflow/react'
import type { ExistingMethodData, MetaCreationData } from '../types'
import type { DragNodePayload } from '../types/solution'

let nodeIdCounter = 100

export function nextNodeId(): string {
  nodeIdCounter += 1
  return `node-${nodeIdCounter}`
}

export function createMetaNode(position: XYPosition) {
  return {
    id: nextNodeId(),
    type: 'metaCreation' as const,
    position,
    data: {
      prompt: '',
      inputType: 'object',
      outputType: 'object',
    } satisfies MetaCreationData,
  }
}

export function createMethodNode(position: XYPosition, payload: Extract<DragNodePayload, { type: 'existingMethod' }>) {
  return {
    id: nextNodeId(),
    type: 'existingMethod' as const,
    position,
    data: {
      methodName: payload.methodName,
      inputType: payload.inputType,
      outputType: payload.outputType,
      className: payload.className,
    } satisfies ExistingMethodData,
  }
}

export function parseDragPayload(raw: string): DragNodePayload | null {
  try {
    const parsed = JSON.parse(raw) as DragNodePayload
    if (parsed.type === 'existingMethod' || parsed.type === 'metaCreation') return parsed
    return null
  } catch {
    return null
  }
}
