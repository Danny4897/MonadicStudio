import { getHostConfig } from '../host/config'

const DEFAULT_API_BASE = 'http://127.0.0.1:5000/api'

export function getApiBase(): string {
  return getHostConfig().apiBase ?? DEFAULT_API_BASE
}
