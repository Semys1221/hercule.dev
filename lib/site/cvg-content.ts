import { readFileSync } from "fs"
import { join } from "path"

export function getCvgMarkdown(): string {
  const filePath = join(process.cwd(), "doc/tech-stack/cvg_master.md")
  return readFileSync(filePath, "utf-8")
}
