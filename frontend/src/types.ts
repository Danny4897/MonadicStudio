export type CSharpVersion = 'C# 8.0' | 'C# 10.0' | 'C# 12.0'
export type ParadigmStyle = 'Functional ROP' | 'Imperative'

export type NodeType = 'existingMethod' | 'metaCreation'

export type ExistingMethodData = {
  methodName: string
  inputType: string
  outputType: string
  className?: string
}

export type MetaCreationData = {
  prompt: string
  inputType: string
  outputType: string
}

export type PipelineNodePayload = {
  id: string
  type: NodeType
  methodName?: string
  inputType?: string
  outputType?: string
  prompt?: string
  positionX?: number
  positionY?: number
  className?: string
}

export type PipelineEdgePayload = {
  id: string
  source: string
  target: string
}

export type PipelineDocument = {
  name: string
  csharpVersion: CSharpVersion
  paradigmStyle: ParadigmStyle
  nodes: PipelineNodePayload[]
  edges: PipelineEdgePayload[]
  savedAt: string
}

export type GenerateRequest = {
  csharpVersion: CSharpVersion
  paradigmStyle: ParadigmStyle
  nodes: PipelineNodePayload[]
}

export type GenerateResponse = {
  code: string
  diagnostics: string[]
  isValid: boolean
}

/** @deprecated use getApiBase() from api/client */
export const API_BASE = 'http://127.0.0.1:5000/api'
