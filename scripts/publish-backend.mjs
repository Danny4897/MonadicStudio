import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const project = join(root, 'backend', 'MonadicStudio.Api.csproj')
const publishDir = join(root, 'extension', 'backend', 'publish')

rmSync(publishDir, { recursive: true, force: true })
mkdirSync(publishDir, { recursive: true })

execSync(`dotnet publish "${project}" -c Release -o "${publishDir}"`, {
  stdio: 'inherit',
  cwd: root,
})

// Pipeline dev data non va nel pacchetto
const pipelines = join(publishDir, 'pipelines')
if (existsSync(pipelines)) {
  rmSync(pipelines, { recursive: true, force: true })
}

console.log(`Published backend -> ${publishDir}`)
