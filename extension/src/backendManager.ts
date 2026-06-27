import { spawn, type ChildProcess } from 'child_process'
import * as fs from 'fs'
import * as http from 'http'
import * as path from 'path'
import type * as vscode from 'vscode'

const API_PORT = 5000
const API_BASE = `http://127.0.0.1:${API_PORT}`

export class BackendManager {
  private process?: ChildProcess
  private readonly backendDir: string

  constructor(extensionPath: string) {
    const devBackend = path.join(extensionPath, '..', 'backend')
    const bundledBackend = path.join(extensionPath, 'backend')
    this.backendDir = fs.existsSync(path.join(devBackend, 'MonadicStudio.Api.csproj'))
      ? devBackend
      : bundledBackend
  }

  async ensureRunning(): Promise<void> {
    if (await this.ping()) return

    const projectFile = path.join(this.backendDir, 'MonadicStudio.Api.csproj')
    if (!fs.existsSync(projectFile)) {
      throw new Error(`Backend non trovato: ${projectFile}`)
    }

    this.process = spawn('dotnet', ['run', '--project', projectFile, '--urls', API_BASE], {
      cwd: this.backendDir,
      shell: true,
      stdio: 'ignore',
      windowsHide: true,
    })

    this.process.on('error', (err) => {
      console.error('[MonadicStudio] backend spawn error', err)
    })

    await this.waitForReady(30_000)
  }

  async bootstrapWorkspace(workspaceRoot: string): Promise<void> {
    await this.postJson('/api/solution/bootstrap', { workspaceRoot })
  }

  dispose(): void {
    if (this.process && !this.process.killed) {
      this.process.kill()
    }
    this.process = undefined
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
      req.setTimeout(1500, () => {
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
          reject(new Error('Timeout avvio backend MonadicStudio'))
          return
        }
        setTimeout(tick, 400)
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
