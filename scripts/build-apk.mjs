/**
 * One-shot: production web build → Capacitor sync → Gradle debug APK.
 * Requires JDK 17+ and Android SDK (command-line tools are enough; Android Studio not required).
 * SDK is resolved from ANDROID_SDK_ROOT / ANDROID_HOME, android/local.properties, or common install paths.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const androidDir = path.join(root, 'android')
const localPropsPath = path.join(androidDir, 'local.properties')

/** Gradle needs both; cmdline-tools-only folder is not enough to build. */
function sdkUsableForGradle(sdkPath) {
  if (!sdkPath || !fs.existsSync(sdkPath)) return false
  const platforms = path.join(sdkPath, 'platforms')
  const buildTools = path.join(sdkPath, 'build-tools')
  return fs.statSync(sdkPath).isDirectory() && fs.existsSync(platforms) && fs.existsSync(buildTools)
}

function readSdkDirFromLocalProperties() {
  if (!fs.existsSync(localPropsPath)) return null
  const text = fs.readFileSync(localPropsPath, 'utf8')
  const m = /^\s*sdk\.dir\s*=\s*(.+)$/m.exec(text)
  if (!m) return null
  let raw = m[1].trim()
  // Properties file escaping on Windows: C\:\\Users\\...
  raw = raw.replace(/\\:/g, ':').replace(/\\\\/g, '\\')
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1)
  }
  return path.resolve(raw)
}

function candidateSdkPaths() {
  const out = []
  const push = (p) => {
    if (p && typeof p === 'string') out.push(path.resolve(p))
  }

  push(process.env.ANDROID_SDK_ROOT)
  push(process.env.ANDROID_HOME)

  const fromFile = readSdkDirFromLocalProperties()
  if (fromFile) push(fromFile)

  const home = os.homedir()

  if (process.platform === 'win32') {
    if (process.env.LOCALAPPDATA) {
      push(path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'))
    }
    push(path.join(home, 'AppData', 'Local', 'Android', 'Sdk'))
    push('C:\\Android\\sdk')
    push('C:\\Android\\Sdk')
  } else if (process.platform === 'darwin') {
    push(path.join(home, 'Library', 'Android', 'sdk'))
    push(path.join(home, 'Android', 'Sdk'))
  } else {
    push(path.join(home, 'Android', 'Sdk'))
    push(path.join(home, 'Android', 'sdk'))
  }

  return [...new Set(out)]
}

function findAndroidSdk() {
  for (const dir of candidateSdkPaths()) {
    if (sdkUsableForGradle(dir)) return dir
  }
  return null
}

function findPartialSdk() {
  /** Folder that looks like SDK root but missing platforms/build-tools */
  const markers = ['cmdline-tools', 'platform-tools', 'licenses']
  for (const dir of candidateSdkPaths()) {
    if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue
    const hasMarker = markers.some((m) => fs.existsSync(path.join(dir, m)))
    const hasPlatforms = fs.existsSync(path.join(dir, 'platforms'))
    if (hasMarker && !hasPlatforms) return dir
  }
  return null
}

function findSdkmanagerCli(sdkRoot) {
  const win = process.platform === 'win32'
  const name = win ? 'sdkmanager.bat' : 'sdkmanager'
  const candidates = [
    path.join(sdkRoot, 'cmdline-tools', 'latest', 'bin', name),
    path.join(sdkRoot, 'cmdline-tools', 'bin', name),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return null
}

function ensureLocalProperties() {
  const sdk = findAndroidSdk()
  if (!sdk) {
    const partial = findPartialSdk()
    console.error(
      [
        'Android SDK not found (or not ready for Gradle).',
        '',
        'This project needs an SDK folder that contains both:',
        '  platforms/     (e.g. android-35)',
        '  build-tools/   (e.g. 35.0.x)',
        '',
        ...(partial
          ? (() => {
              const sm = findSdkmanagerCli(partial)
              const pkgs = '"platform-tools" "platforms;android-35" "build-tools;35.0.0"'
              const cmd = sm ? `"${sm}" ${pkgs}` : `sdkmanager ${pkgs}  (from cmdline-tools/.../bin inside your SDK)`
              return [
                `Found a partial SDK at: ${partial}`,
                'Install required packages:',
                `  ${cmd}`,
                '',
              ]
            })()
          : []),
        'Then either:',
        '  • Set ANDROID_HOME to that SDK folder, or',
        '  • Install to the default path (Windows): %LOCALAPPDATA%\\Android\\Sdk',
        '',
        'Install command-line tools (no Android Studio required):',
        'https://developer.android.com/studio#command-line-tools-only',
      ].join('\n'),
    )
    process.exit(1)
  }

  const line = `sdk.dir=${sdk.replace(/\\/g, '/')}\n`
  if (!fs.existsSync(localPropsPath)) {
    fs.writeFileSync(localPropsPath, line, 'utf8')
    console.log(`Created android/local.properties (sdk.dir=${sdk}).`)
    return
  }

  const existing = fs.readFileSync(localPropsPath, 'utf8')
  if (!/^\s*sdk\.dir\s*=/m.test(existing)) {
    fs.appendFileSync(localPropsPath, `\n${line}`, 'utf8')
    console.log('Appended sdk.dir to android/local.properties.')
  }
}

function run(label, command, args, cwd, shell = process.platform === 'win32') {
  console.log(`\n▶ ${label}\n`)
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell,
  })
  const code = result.status ?? 1
  if (code !== 0) {
    console.error(`\n"${label}" failed with exit code ${code}.`)
    process.exit(code)
  }
}

run('Vite production build', 'npm', ['run', 'build'], root)
run('Capacitor sync (android)', 'npx', ['cap', 'sync', 'android'], root)
ensureLocalProperties()

const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew'
// Always clean first: without this, a one-off corrupt/stale packageDebug output can leave a multi‑GB
// APK on disk (ZIP local-header garbage) while Gradle still reports success on incremental builds.
const skipClean = process.env.SKIP_GRADLE_CLEAN === '1' || process.env.SKIP_GRADLE_CLEAN === 'true'
if (skipClean) {
  run('Gradle assembleDebug', gradleCmd, ['assembleDebug'], androidDir, true)
} else {
  run('Gradle clean + assembleDebug', gradleCmd, ['clean', 'assembleDebug'], androidDir, true)
}

const apkDir = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug')
console.log(`\n✓ Debug APK: ${path.join(apkDir, 'app-debug.apk')}\n`)
