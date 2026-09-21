import sharp from "sharp"
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const iconSvg = readFileSync(join(root, "app/icon.svg"))

const appleIcon = await sharp(iconSvg).resize(180, 180).png().toBuffer()
writeFileSync(join(root, "app/apple-icon.png"), appleIcon)
writeFileSync(join(root, "public/apple-icon.png"), appleIcon)

const favicon32 = await sharp(iconSvg).resize(32, 32).png().toBuffer()
writeFileSync(join(root, "public/icon-32x32.png"), favicon32)

console.log("Generated app/apple-icon.png, public/apple-icon.png, and public/icon-32x32.png")
