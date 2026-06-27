import type { Edge, Node } from '@xyflow/react'
import type { CSharpVersion, ParadigmStyle, PipelineDocument, PipelineEdgePayload, PipelineNodePayload } from '../types'

export function orderPipelineNodes(nodes: Node[], edges: Edge[]): PipelineNodePayload[] {
  if (nodes.length === 0) return []

  const incoming = new Map<string, number>()
  const adjacency = new Map<string, string[]>()

  for (const node of nodes) {
    incoming.set(node.id, 0)
    adjacency.set(node.id, [])
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target)
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1)
  }

  const queue = nodes
    .filter((n) => (incoming.get(n.id) ?? 0) === 0)
    .map((n) => n.id)

  const ordered: string[] = []
  while (queue.length > 0) {
    const current = queue.shift()!
    ordered.push(current)

    for (const next of adjacency.get(current) ?? []) {
      const count = (incoming.get(next) ?? 1) - 1
      incoming.set(next, count)
      if (count === 0) queue.push(next)
    }
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const fallback = nodes.map((n) => n.id)
  const ids = ordered.length === nodes.length ? ordered : fallback

  return ids.map((id) => nodeToPayload(nodeMap.get(id)!))
}

export function nodeToPayload(node: Node): PipelineNodePayload {
  const data = node.data as Record<string, string>

  if (node.type === 'metaCreation') {
    return {
      id: node.id,
      type: 'metaCreation',
      prompt: data.prompt ?? '',
      inputType: data.inputType,
      outputType: data.outputType,
      positionX: node.position.x,
      positionY: node.position.y,
    }
  }

  return {
    id: node.id,
    type: 'existingMethod',
    methodName: data.methodName,
    inputType: data.inputType,
    outputType: data.outputType,
    className: data.className,
    positionX: node.position.x,
    positionY: node.position.y,
  }
}

export function documentToFlow(document: PipelineDocument): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = document.nodes.map((n) => {
    const position = { x: n.positionX ?? 0, y: n.positionY ?? 0 }

    if (n.type === 'metaCreation') {
      return {
        id: n.id,
        type: 'metaCreation',
        position,
        data: {
          prompt: n.prompt ?? '',
          inputType: n.inputType ?? 'object',
          outputType: n.outputType ?? 'object',
        },
      }
    }

    return {
      id: n.id,
      type: 'existingMethod',
      position,
      data: {
        methodName: n.methodName ?? 'NewMethod',
        inputType: n.inputType ?? 'object',
        outputType: n.outputType ?? 'Result<object, Error>',
        className: n.className,
      },
    }
  })

  const edges: Edge[] = document.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: true,
  }))

  return { nodes, edges }
}

export function flowToDocument(
  name: string,
  csharpVersion: CSharpVersion,
  paradigmStyle: ParadigmStyle,
  nodes: Node[],
  edges: Edge[],
): PipelineDocument {
  const edgePayloads: PipelineEdgePayload[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
  }))

  return {
    name,
    csharpVersion,
    paradigmStyle,
    nodes: nodes.map(nodeToPayload),
    edges: edgePayloads,
    savedAt: new Date().toISOString(),
  }
}
