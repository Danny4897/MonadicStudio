export type SolutionMethod = {
  name: string
  inputType: string
  outputType: string
  isStatic: boolean
}

export type SolutionClass = {
  name: string
  namespace: string
  methods: SolutionMethod[]
}

export type SolutionTreeResponse = {
  sourcePath: string | null
  isFallback: boolean
  classes: SolutionClass[]
}

export type DragNodePayload =
  | {
      type: 'existingMethod'
      methodName: string
      inputType: string
      outputType: string
      className?: string
    }
  | { type: 'metaCreation' }

export const DRAG_MIME = 'application/reactflow'

export type SolutionSettings = {
  projectPath: string | null
  outputDirectory: string | null
  rootNamespace: string | null
  outputFileName: string
}

export type SolutionDiscoverResponse = {
  found: boolean
  projectPath: string | null
  suggestedOutputDirectory: string | null
  suggestedNamespace: string | null
  message: string | null
}

export type ExportCodeResponse = {
  filePath: string
  code: string
  diagnostics: string[]
  isValid: boolean
}
