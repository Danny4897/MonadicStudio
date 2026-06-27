import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import type { ExistingMethodData } from '../types'

export function ExistingMethodNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow()
  const { methodName, inputType, outputType, className } = data as ExistingMethodData

  const update = (field: keyof ExistingMethodData, value: string) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, [field]: value } } : node,
      ),
    )
  }

  return (
    <div className="flow-node">
      <Handle type="target" position={Position.Left} />
      <div className="flow-node-header">
        <span className="flow-node-type">
          {className ? `${className}` : 'Existing Method'}
        </span>
        <input
          value={methodName}
          onChange={(e) => update('methodName', e.target.value)}
          className="tb-input mt-1.5 border-transparent! bg-transparent! p-0! font-semibold"
          style={{ color: 'var(--color-tb-accent)' }}
        />
      </div>
      <div className="flow-node-body">
        <label className="flex flex-col gap-1">
          <span className="flow-field-label">Input</span>
          <input
            value={inputType}
            onChange={(e) => update('inputType', e.target.value)}
            className="tb-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="flow-field-label">Output</span>
          <input
            value={outputType}
            onChange={(e) => update('outputType', e.target.value)}
            className="tb-input"
            style={{ color: 'var(--color-tb-success)' }}
          />
        </label>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
