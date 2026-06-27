import type { Edge, Node } from '@xyflow/react'

export const initialNodes: Node[] = [
  {
    id: 'node-1',
    type: 'existingMethod',
    position: { x: 80, y: 120 },
    data: {
      methodName: 'ValidateRequest',
      inputType: 'Request',
      outputType: 'Result<Request>',
      className: 'RequestValidator',
    },
  },
  {
    id: 'node-2',
    type: 'metaCreation',
    position: { x: 380, y: 120 },
    data: {
      prompt: '',
      inputType: 'Request',
      outputType: 'User',
    },
  },
  {
    id: 'node-3',
    type: 'existingMethod',
    position: { x: 680, y: 120 },
    data: {
      methodName: 'SaveToDb',
      inputType: 'User',
      outputType: 'Result<User>',
      className: 'UserRepository',
    },
  },
]

export const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
  { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
]
