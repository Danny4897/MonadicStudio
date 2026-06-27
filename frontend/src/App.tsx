import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { loadPipeline, savePipeline } from './api/pipelineApi'
import { exportToSolution } from './api/solutionApi'
import { CodePanel } from './components/CodePanel'
import { CanvasEmptyState } from './components/CanvasEmptyState'
import { Navbar } from './components/Navbar'
import { SolutionExplorer } from './components/SolutionExplorer'
import { Topbar, checkBackendHealth } from './components/Topbar'
import { initialEdges, initialNodes } from './data/mockData'
import { useAddMetaNode } from './hooks/useAddMetaNode'
import { useDebouncedEffect } from './hooks/useDebouncedEffect'
import { ExistingMethodNode } from './nodes/ExistingMethodNode'
import { MetaCreationNode } from './nodes/MetaCreationNode'
import { getApiBase } from './api/client'
import { getHostConfig, isVsCodeHost, waitForHostBootstrap } from './host/vscode'
import type { CSharpVersion, GenerateResponse, ParadigmStyle } from './types'
import { DRAG_MIME } from './types/solution'
import { createMethodNode, createMetaNode, parseDragPayload } from './utils/createNode'
import { documentToFlow, flowToDocument, orderPipelineNodes } from './utils/orderPipeline'

const nodeTypes: NodeTypes = {
  existingMethod: ExistingMethodNode,
  metaCreation: MetaCreationNode,
}

function StudioCanvas() {
  const { screenToFlowPosition } = useReactFlow()
  const addMetaNode = useAddMetaNode()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [csharpVersion, setCSharpVersion] = useState<CSharpVersion>('C# 12.0')
  const [paradigmStyle, setParadigmStyle] = useState<ParadigmStyle>('Functional ROP')
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [diagnostics, setDiagnostics] = useState<string[]>([])
  const [isValid, setIsValid] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployMessage, setDeployMessage] = useState<string | null>(null)
  const [hostReady, setHostReady] = useState(!isVsCodeHost())
  const [backendOnline, setBackendOnline] = useState(false)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isVsCodeHost()) return
    void waitForHostBootstrap().then(() => {
      setHostReady(true)
      const cfg = getHostConfig()
      if (cfg.engineOnline !== undefined) {
        setBackendOnline(cfg.engineOnline)
      }
    })
  }, [])

  useEffect(() => {
    if (!hostReady) return
    const ping = async () => setBackendOnline(await checkBackendHealth())
    void ping()
    const interval = window.setInterval(() => void ping(), 10000)
    return () => window.clearInterval(interval)
  }, [hostReady])

  useEffect(() => {
    if (!hostReady) return
    const load = async () => {
      try {
        const document = await loadPipeline('default')
        if (document && document.nodes.length > 0) {
          const flow = documentToFlow(document)
          setNodes(flow.nodes)
          setEdges(flow.edges)
          setCSharpVersion(document.csharpVersion)
          setParadigmStyle(document.paradigmStyle)
        }
      } catch {
        // mock data
      } finally {
        setIsLoaded(true)
      }
    }

    void load()
  }, [setNodes, setEdges, hostReady])

  const persistPipeline = useCallback(async () => {
    if (!isLoaded) return

    setIsSaving(true)
    setSaveStatus('idle')

    try {
      const document = flowToDocument('default', csharpVersion, paradigmStyle, nodes, edges)
      await savePipeline(document)
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }, [csharpVersion, paradigmStyle, nodes, edges, isLoaded])

  useDebouncedEffect(() => {
    void persistPipeline()
  }, [nodes, edges, csharpVersion, paradigmStyle, isLoaded], 1500)

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    [setEdges],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const raw = event.dataTransfer.getData(DRAG_MIME)
      const payload = parseDragPayload(raw)
      if (!payload) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      if (payload.type === 'metaCreation') {
        setNodes((nds) => nds.concat(createMetaNode(position)))
        return
      }

      setNodes((nds) => nds.concat(createMethodNode(position, payload)))
    },
    [screenToFlowPosition, setNodes],
  )

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setError(null)

    const payload = {
      csharpVersion,
      paradigmStyle,
      nodes: orderPipelineNodes(nodes, edges),
    }

    try {
      const response = await fetch(`${getApiBase()}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`)
      }

      const data = (await response.json()) as GenerateResponse
      setGeneratedCode(data.code)
      setDiagnostics(data.diagnostics ?? [])
      setIsValid(data.isValid ?? true)
    } catch (err) {
      setGeneratedCode(null)
      setDiagnostics([])
      setError(err instanceof Error ? err.message : 'Errore durante la generazione')
    } finally {
      setIsGenerating(false)
    }
  }, [csharpVersion, paradigmStyle, nodes, edges])

  const handleDeploy = useCallback(async () => {
    setIsDeploying(true)
    setDeployMessage(null)
    setError(null)

    try {
      const result = await exportToSolution({
        csharpVersion,
        paradigmStyle,
        nodes: orderPipelineNodes(nodes, edges),
      })
      setGeneratedCode(result.code)
      setDiagnostics(result.diagnostics ?? [])
      setIsValid(result.isValid ?? true)
      setDeployMessage(`Scritto in ${result.filePath}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deploy fallito')
    } finally {
      setIsDeploying(false)
    }
  }, [csharpVersion, paradigmStyle, nodes, edges])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        void handleGenerate()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleGenerate])

  if (!hostReady) {
    return (
      <div className="app app-loading">
        <p>Collegamento workspace…</p>
      </div>
    )
  }

  return (
    <div className="app">
      <Topbar nodeCount={nodes.length} edgeCount={edges.length} backendOnline={backendOnline} />

      <Navbar
        csharpVersion={csharpVersion}
        paradigmStyle={paradigmStyle}
        isGenerating={isGenerating}
        isSaving={isSaving}
        saveStatus={saveStatus}
        onCSharpVersionChange={setCSharpVersion}
        onParadigmStyleChange={setParadigmStyle}
        onGenerate={handleGenerate}
        onSave={() => void persistPipeline()}
        onAddMetaNode={addMetaNode}
      />

      <div className="app-body">
        <SolutionExplorer />

        <main ref={reactFlowWrapper} className="canvas-area">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            deleteKeyCode={['Backspace', 'Delete']}
            fitView
          >
            <Background gap={24} size={1} color="rgb(255 255 255 / 0.04)" />
            <Controls position="bottom-left" />
            <MiniMap
              nodeColor={(n) => (n.type === 'metaCreation' ? '#8b5cf6' : '#6366f1')}
              maskColor="rgb(9 9 11 / 0.8)"
            />
          </ReactFlow>

          <div className="canvas-hint">
            Trascina metodi dall&apos;explorer · <kbd>+ Meta</kbd> · <kbd>Ctrl+G</kbd> genera
          </div>

          <CanvasEmptyState visible={nodes.length === 0} />

          <CodePanel
            code={generatedCode}
            error={error}
            diagnostics={diagnostics}
            isValid={isValid}
            isDeploying={isDeploying}
            deployMessage={deployMessage}
            onDeploy={() => void handleDeploy()}
            onClose={() => {
              setGeneratedCode(null)
              setError(null)
              setDiagnostics([])
              setDeployMessage(null)
            }}
          />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <StudioCanvas />
    </ReactFlowProvider>
  )
}
