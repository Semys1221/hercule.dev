/** Wide house layout for public marketing pages */
export const MARKETING_PAGE_GUTTER = "px-8 md:px-16"
export const MARKETING_PAGE_MAX = "mx-auto w-full max-w-[1440px]"

export function marketingPageShellClassName(extra?: string) {
  return [MARKETING_PAGE_MAX, MARKETING_PAGE_GUTTER, extra].filter(Boolean).join(" ")
}
