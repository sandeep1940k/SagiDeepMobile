#!/usr/bin/env node
/**
 * Writes Android launcher PNGs from your YouTube channel picture.
 * Keep AVATAR_URL in sync with `avatarUrl` in src/data/youtubeChannel.js
 * (use `=s512-c-k-c0x00ffffff-no-rj` or larger for best results).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const resRoot = join(__dirname, '..', 'android', 'app', 'src', 'main', 'res')

const AVATAR_URL =
  'https://yt3.googleusercontent.com/kuUPRZ_17dMSqxyrEsCaH1KPpscV-PY9XjDwW49RJgmmmilCot6zX_VMm5hCmXQHLRE5O4VHPw=s512-c-k-c0x00ffffff-no-rj'

/** Adaptive-icon foreground layer (dp 108 → px per density). */
const ADAPTIVE_FOREGROUND_PX = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
}

/** Legacy launcher icons (pre–adaptive). */
const LEGACY_PX = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
}

async function main() {
  const fetched = await fetch(AVATAR_URL, { redirect: 'follow' })
  if (!fetched.ok) throw new Error(`Avatar download failed: HTTP ${fetched.status}`)
  const input = Buffer.from(await fetched.arrayBuffer())

  for (const [folder, size] of Object.entries(ADAPTIVE_FOREGROUND_PX)) {
    const dir = join(resRoot, folder)
    mkdirSync(dir, { recursive: true })
    const png = await sharp(input)
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .png()
      .toBuffer()
    writeFileSync(join(dir, 'ic_launcher_foreground.png'), png)
  }

  for (const [folder, size] of Object.entries(LEGACY_PX)) {
    const dir = join(resRoot, folder)
    mkdirSync(dir, { recursive: true })
    const png = await sharp(input)
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .png()
      .toBuffer()
    writeFileSync(join(dir, 'ic_launcher.png'), png)
    writeFileSync(join(dir, 'ic_launcher_round.png'), png)
  }

  console.log('Launcher icons updated from YouTube avatar → android/app/src/main/res/mipmap-*')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
