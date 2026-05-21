import { spawn } from 'node:child_process'
import process from 'node:process'

const DEV_SERVER_PORT = 1420
const DEV_SERVER_URLS = [
  `http://127.0.0.1:${DEV_SERVER_PORT}`,
  `http://[::1]:${DEV_SERVER_PORT}`,
  `http://localhost:${DEV_SERVER_PORT}`,
]

/**
 * 用最短超时探测指定 URL，避免在端口占用时长时间卡住。
 */
async function fetchText(url) {
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), 1500)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    })

    if (!response.ok) {
      return null
    }

    return await response.text()
  } catch {
    return null
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

/**
 * 判断当前端口上是否已经是本仓库的 Vite dev server。
 */
async function findReusableDevServerUrl() {
  for (const baseUrl of DEV_SERVER_URLS) {
    const [mainHtml, overlayHtml] = await Promise.all([
      fetchText(baseUrl),
      fetchText(`${baseUrl}/overlay-control.html`),
    ])

    const matchesMainEntry =
      mainHtml?.includes('<div id="app"></div>') &&
      mainHtml.includes('/src/main.ts')
    const matchesOverlayEntry =
      overlayHtml?.includes('Collapsed Control') &&
      overlayHtml.includes('/src/overlay-control.ts')

    if (matchesMainEntry && matchesOverlayEntry) {
      return baseUrl
    }
  }

  return null
}

/**
 * 判断端口是否被其他进程占用。
 */
async function isPortOccupied() {
  for (const baseUrl of DEV_SERVER_URLS) {
    const responseText = await fetchText(baseUrl)
    if (responseText !== null) {
      return true
    }
  }

  return false
}

/**
 * 复用已存在的 dev server 时，让 beforeDevCommand 保持存活。
 */
async function keepAliveForReusedServer(serverUrl) {
  console.log(`[run-vite-dev] Reusing existing Vite dev server: ${serverUrl}`)
  await new Promise(() => {})
}

/**
 * 启动新的 Vite dev server，并把生命周期交给当前脚本托管。
 */
async function startFreshDevServer() {
  const command =
    process.platform === 'win32'
      ? ['cmd.exe', ['/d', '/s', '/c', 'pnpm', 'dev']]
      : ['pnpm', ['dev']]

  const child = spawn(command[0], command[1], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  })

  const forwardSignal = (signal) => {
    if (!child.killed) {
      child.kill(signal)
    }
  }

  process.on('SIGINT', forwardSignal)
  process.on('SIGTERM', forwardSignal)

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 1)
  })
}

/**
 * 主流程：优先复用当前仓库已有 dev server，其次再尝试拉起新的。
 */
async function main() {
  const reusableServerUrl = await findReusableDevServerUrl()
  if (reusableServerUrl) {
    await keepAliveForReusedServer(reusableServerUrl)
    return
  }

  if (await isPortOccupied()) {
    throw new Error(
      `Port ${DEV_SERVER_PORT} is already in use by another process. Please stop it before starting this repo's Tauri dev server.`,
    )
  }

  await startFreshDevServer()
}

void main().catch((error) => {
  console.error('[run-vite-dev] Failed to prepare Vite dev server.')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
