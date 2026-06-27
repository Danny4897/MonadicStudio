import { spawn, type ChildProcess } from 'child_process'
import * as fs from 'fs'
import * as http from 'http'
import * as path from 'path'
import { log } from './log'

const API_PORT = 5000
const API_BASE = `http://127.0.0.1:${API_PORT}`

type LaunchTarget =
  | { kind: 'dll'; dllPath: string; cwd: string }
  | { kind: 'project'; projectPath: string; cwd: string }

export class BackendManager {
  private process?: ChildProcess
  private starting?: Promise<void>
  private readonly target: LaunchTarget

  constructor(extensionPath: string) {
    const bundledDll = path.join(extensionPath, 'backend', 'publish', 'MonadicStudio.Api.dll')
    const devProject = path.join(extensionPath, '..', 'backend', 'MonadicStudio.Api.csproj')

    if (fs.existsSync(bundledDll)) {
      this.target = { kind: 'dll', dllPath: bundledDll, cwd: path.dirname(bundledDll) }
      log(`Backend bundled: ${bundledDll}`)
    } else if (fs.existsSync(devProject)) {
      this.target = { kind: 'project', projectPath: devProject, cwd: path.dirname(devProject) }
      log(`Backend dev: ${devProject}`)
    } else {
      this.target = { kind: 'project', projectPath: devProject, cwd: path.dirname(devProject) }
      log(`Backend non trovato (atteso: ${bundledDll})`)
    }
  }

  async ensureRunning(): Promise<void> {
    if (await this.ping()) return
    if (this.starting) return this.starting

    this.starting = this.startProcess()
    try {
      await this.starting
    } finally {
      this.starting = undefined
    }
  }

  async bootstrapWorkspace(workspaceRoot: string): Promise<void> {
    await this.ensureRunning()
    await this.postJson('/api/solution/bootstrap', { workspaceRoot })
  }

  dispose(): void {
    if (this.process && !this.process.killed) {
      this.process.kill()
    }
    this.process = undefined
  }

  private async startProcess(): Promise<void> {
    if (this.target.kind === 'dll') {
      if (!fs.existsSync(this.target.dllPath)) {
        throw new Error(
          'Engine MonadicStudio non incluso nel pacchetto. Reinstalla l’estensione o installa .NET 8 SDK.',
        )
      }
    } else if (!fs.existsSync(this.target.projectPath)) {
      throw new Error(
        `Backend non trovato. Serve .NET 8 SDK oppure reinstalla l’estensione MonadicStudio.`,
      )
    }

    log(`Avvio engine su ${API_BASE}...`)

    const args =
      this.target.kind === 'dll'
        ? ['exec', path.basename(this.target.dllPath), '--urls', API_BASE]
        : ['run', '--project', this.target.projectPath, '--urls', API_BASE]

    const cwd = this.target.cwd

    this.process = spawn('dotnet', args, {
      cwd,
      shell: true,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ASPNETCORE_URLS: API_BASE, DOTNET_CLI_UI_LANGUAGE: 'en' },
    })

    this.process.stdout?.on('data', (chunk: Buffer) => log(chunk.toString().trimEnd()))
    this.process.stderr?.on('data', (chunk: Buffer) => log(`[stderr] ${chunk.toString().trimEnd()}`))
    this.process.on('error', (err) => log(`spawn error: ${err.message}`))
    this.process.on('exit', (code, signal) => {
      log(`Engine terminato (code=${code ?? 'null'}, signal=${signal ?? 'null'})`)
      this.process = undefined
    })

    await this.waitForReady(45_000)
    log('Engine online')
  }

  private async ping(): Promise<boolean> {
    for (const route of ['/api/health', '/api/pipeline']) {
      if (await this.pingRoute(route)) return true
    }
    return false
  }

  private pingRoute(route: string): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(`${API_BASE}${route}`, (res) => {
        resolve(res.statusCode === 200)
        res.resume()
      })
      req.on('error', () => resolve(false))
      req.setTimeout(2000, () => {
        req.destroy()
        resolve(false)
      })
    })
  }

  private waitForReady(timeoutMs: number): Promise<void> {
    const started = Date.now()
    return new Promise((resolve, reject) => {
      const tick = async () => {
        if (await this.ping()) {
          resolve()
          return
        }
        if (Date.now() - started > timeoutMs) {
          reject(
            new Error(
              'Timeout avvio engine. Verifica .NET 8 SDK (`dotnet --version`) e che la porta 5000 sia libera. Log: Output → MonadicStudio',
            ),
          )
          return
        }
        setTimeout(tick, 500)
      }
      void tick()
    })
  }

  private postJson(route: string, body: unknown): Promise<void> {
    const payload = JSON.stringify(body)
    return new Promise((resolve, reject) => {
      const req = http.request(
        `${API_BASE}${route}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          let data = ''
          res.on('data', (chunk) => (data += chunk))
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve()
            } else {
              reject(new Error(data || `Bootstrap failed: ${res.statusCode}`))
            }
          })
        },
      )
      req.on('error', reject)
      req.write(payload)
      req.end()
    })
  }
}

export function getWorkspaceRoot(vscode: typeof import('vscode')): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
}
