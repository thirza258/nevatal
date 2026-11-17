import { readdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const previewsDir = join(here, '..', 'public', 'previews')
const publicDir = join(here, '..', 'public')

async function optimize() {
  const files = await readdir(previewsDir)
  const jpgs = files.filter((f) => f.endsWith('.jpg'))
  let totalOrig = 0
  let totalWebp = 0

  for (const file of jpgs) {
    const inputPath = join(previewsDir, file)
    const outputPath = join(previewsDir, file.replace(/\.jpg$/, '.webp'))
    const { size } = await stat(inputPath)
    totalOrig += size

    await sharp(inputPath)
      .webp({ quality: 80, effort: 4 })
      .toFile(outputPath)

    const { size: webpSize } = await stat(outputPath)
    totalWebp += webpSize
  }

  console.log(
    `Optimized ${jpgs.length} preview images: ${(totalOrig / 1024).toFixed(1)} KB -> ${(totalWebp / 1024).toFixed(1)} KB (saved ${((1 - totalWebp / totalOrig) * 100).toFixed(1)}%)`
  )

  // Generate favicon.ico if missing
  const faviconPath = join(publicDir, 'favicon.ico')
  const logoPath = join(publicDir, 'logo.png')
  try {
    await sharp(logoPath)
      .resize(32, 32)
      .toFormat('png')
      .toFile(faviconPath)
    console.log('Generated public/favicon.ico')
  } catch (err) {
    console.warn('Could not generate favicon.ico:', err.message)
  }
}

optimize().catch((err) => {
  console.error('Error optimizing images:', err)
  process.exit(1)
})
