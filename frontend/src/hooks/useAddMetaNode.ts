import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { createMetaNode } from '../utils/createNode'

export function useAddMetaNode() {
  const { setNodes, getViewport } = useReactFlow()

  return useCallback(() => {
    const { x, y, zoom } = getViewport()
    const centerX = (-x + window.innerWidth / 2) / zoom
    const centerY = (-y + window.innerHeight / 2) / zoom
    const node = createMetaNode({ x: centerX - 130, y: centerY - 60 })
    setNodes((nds) => nds.concat(node))
  }, [setNodes, getViewport])
}
