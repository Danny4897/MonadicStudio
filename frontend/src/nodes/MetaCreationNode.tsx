import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import type { MetaCreationData } from '../types'

export function MetaCreationNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow()
  const { prompt, inputType, outputType } = data as MetaCreationData

  const onPromptChange = (value: string) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, prompt: value } } : node,
      ),
    )
  }

  return (
    <div className="flow-node meta">
      <Handle type="target" position={Position.Left} />
      <div className="flow-node-header">
        <span className="flow-node-type">Meta Creation</span>
      </div>
      <div className="flow-node-body">
        <label className="flex flex-col gap-1">
          <span className="flow-field-label">Prompt</span>
          <input
            type="text"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Map User to DbUser"
            className="tb-input"
          />
        </label>
        <div className="flex justify-between text-xs">
          <span className="flow-field-label">In → Out</span>
          <span className="font-mono" style={{ color: 'var(--color-tb-secondary)' }}>
            {inputType} → {outputType}
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
