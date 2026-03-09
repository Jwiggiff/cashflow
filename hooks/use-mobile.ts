import * as React from "react"

const MOBILE_BREAKPOINT = 768
/** Use filter sheet (search + Filters button) instead of inline filters below this width (Tailwind xl) */
const FILTER_SHEET_BREAKPOINT = 1536

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useFilterSheet() {
  const [useSheet, setUseSheet] = React.useState<boolean>(true)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${FILTER_SHEET_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setUseSheet(window.innerWidth < FILTER_SHEET_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setUseSheet(window.innerWidth < FILTER_SHEET_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return useSheet
}
