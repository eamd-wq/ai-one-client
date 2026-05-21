import { spawn } from 'node:child_process'
import { delimiter } from 'node:path'
import process from 'node:process'
import { homedir } from 'node:os'

/**
 * 为 Tauri CLI 补齐 Windows 常见工具链路径，避免新终端里找不到 cargo / makensis。
 */
function createEnv() {
  const env = { ...process.env }
  const pathEntries = (env.PATH ?? '').split(delimiter).filter(Boolean)
  const prependEntries = []

  if (process.platform === 'win32') {
    prependEntries.push(
      `${homedir()}\\.cargo\\bin`,
      'C:\\Program Files (x86)\\NSIS',
      'C:\\Program Files (x86)\\NSIS\\Bin',
    )
  }

  env.PATH = [...prependEntries, ...pathEntries].join(delimiter)
  return env
}

const command =
  process.platform === 'win32'
    ? ['cmd.exe', ['/d', '/s', '/c', 'pnpm', 'exec', 'tauri', ...process.argv.slice(2)]]
    : ['pnpm', ['exec', 'tauri', ...process.argv.slice(2)]]

const child = spawn(command[0], command[1], {
  cwd: process.cwd(),
  env: createEnv(),
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
