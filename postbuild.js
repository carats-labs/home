import { cpSync } from 'fs'
import { join } from 'path'
const dirname = import.meta.dirname
const enLatest = join(dirname, 'dist', 'en', 'latest')
const root = join(dirname, 'dist')


cpSync(enLatest, root, { recursive: true })
