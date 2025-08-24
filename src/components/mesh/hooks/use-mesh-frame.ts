import { useEffect, useRef, useState } from 'react'

export type FrameRect = { x: number; y: number; width: number; height: number }

type UseMeshFrameArgs = {
  initialSize: { width: number; height: number }
  uiSize: { width?: number; height?: number }
  onCommitSize?: (size: { width: number; height: number }) => void
}

// Encapsulates positioning, zoom, dragging and resizing of the preview frame.
export function useMeshFrame({ initialSize, uiSize, onCommitSize }: UseMeshFrameArgs) {
  
  const containerRef = useRef<HTMLDivElement>(null)
  const outerRef = useRef<HTMLDivElement>(null)

  const onCommitSizeRef = useRef<UseMeshFrameArgs['onCommitSize'] | undefined>(undefined)
  useEffect(() => {
    onCommitSizeRef.current = onCommitSize
  }, [onCommitSize])

  const [frame, setFrame] = useState<FrameRect>(() => ({ x: 0, y: 0, width: uiSize.width ?? initialSize.width, height: uiSize.height ?? initialSize.height }))
  const frameRef = useRef(frame)

  useEffect(() => {
    frameRef.current = frame
  }, [frame])

  // Center frame on mount and apply initial UI size if provided
  useEffect(() => {
    const c = containerRef.current
    if (!c) return
    const rect = c.getBoundingClientRect()
    setFrame((f) => ({ width: f.width, height: f.height, x: Math.max(0, Math.round((rect.width - f.width) / 2)), y: Math.max(0, Math.round((rect.height - f.height) / 2)) }))
    if (uiSize.width || uiSize.height) {
      setFrame((f) => ({ ...f, width: uiSize.width ?? f.width, height: uiSize.height ?? f.height }))
    }
  }, [])

  // React to external uiSize changes (sidebar sliders). Keep centered and clamped.
  useEffect(() => {
    const c = containerRef.current
    if (!c) return
    const rect = c.getBoundingClientRect()
    setFrame((f) => {
      const nextW = uiSize.width ?? f.width
      const nextH = uiSize.height ?? f.height
      if (nextW === f.width && nextH === f.height) return f
      const w = Math.max(50, Math.min(Math.floor(rect.width), nextW))
      const h = Math.max(50, Math.min(Math.floor(rect.height), nextH))
      let x = f.x
      let y = f.y
      x = Math.max(0, Math.min(Math.round(f.x + (f.width - w) / 2), Math.floor(rect.width - w)))
      y = Math.max(0, Math.min(Math.round(f.y + (f.height - h) / 2), Math.floor(rect.height - h)))
      return { x, y, width: w, height: h }
    })
  }, [uiSize.width, uiSize.height])

  // Adapt frame to container resize (keep inside and clamp size to container)
  useEffect(() => {
    let ro: ResizeObserver | undefined
    let rafId = 0
    const attach = () => {
      const c = containerRef.current
      if (!c) {
        if (!rafId) console.log('[useMeshFrame] container resize observer waiting for container...')
        rafId = requestAnimationFrame(attach)
        return
      }
      const onResize = () => {
        const rect = c.getBoundingClientRect()
        setFrame((f) => {
          const w = Math.min(f.width, Math.floor(rect.width))
          const h = Math.min(f.height, Math.floor(rect.height))
          const maxX = Math.floor(rect.width - w)
          const maxY = Math.floor(rect.height - h)
          const x = Math.min(Math.max(f.x, 0), Math.max(0, maxX))
          const y = Math.min(Math.max(f.y, 0), Math.max(0, maxY))
          return { x, y, width: w, height: h }
        })
      }
      ro = new ResizeObserver(onResize)
      ro.observe(c)
      // Fire once initially as well
      onResize()
    }
    attach()
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      ro?.disconnect()
    }
  }, [])

  // Zoom with wheel over container (anchor at cursor)
  useEffect(() => {
    let cleanup: (() => void) | undefined
    let rafId = 0
    const attach = () => {
      const c = containerRef.current
      if (!c) {
        if (!rafId) console.log('[useMeshFrame] zoom listener waiting for container...')
        rafId = requestAnimationFrame(attach)
        return
      }

      const onWheel = (e: WheelEvent) => {
        e.preventDefault()
        const factor = e.deltaY > 0 ? 0.975 : 1.025
        const crect = c.getBoundingClientRect()
        const cw = crect.width
        const ch = crect.height
        const ax = e.clientX - crect.left // absolute x
        const ay = e.clientY - crect.top // absolute y

        setFrame((f) => {
          const rx = f.width > 0 ? (ax - f.x) / f.width : 0.5 // relative x
          const ry = f.height > 0 ? (ay - f.y) / f.height : 0.5 // relative y
         
          const minW = 200
          const minH = 100
          const sMin = Math.max(minW / f.width, minH / f.height)
          const maxW = cw //Math.max(minW, crect.width * 6)
          const maxH = ch //Math.max(minH, crect.height * 6)
          const sMax = Math.min(maxW / f.width, maxH / f.height)
          const sCandidate = factor
          const s = Math.max(sMin, Math.min(sMax, sCandidate))
          if (Math.abs(s - 1) < 1e-3) return f
          const newW = f.width * s
          const newH = f.height * s
          let nx = Math.round(ax - rx * newW)
          let ny = Math.round(ay - ry * newH)
          const minX = 0
          const maxX = Math.floor(crect.width - newW)
          const minY = 0
          const maxY = Math.floor(crect.height - newH)
          const clampXMin = Math.min(minX, maxX)
          const clampXMax = Math.max(minX, maxX)
          const clampYMin = Math.min(minY, maxY)
          const clampYMax = Math.max(minY, maxY)
          nx = Math.min(Math.max(nx, clampXMin), clampXMax)
          ny = Math.min(Math.max(ny, clampYMin), clampYMax)
          //console.log('[useMeshFrame] zoom', { factor, s, from: f, to: { x: nx, y: ny, width: newW, height: newH } })
          return { x: nx, y: ny, width: Math.round(newW), height: Math.round(newH) }
        })
      }
      c.addEventListener('wheel', onWheel, { passive: false })
      cleanup = () => {
        console.log('[useMeshFrame] zoom listener detached')
        c.removeEventListener('wheel', onWheel)
      }
    }
    attach()
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      cleanup?.()
    }
  }, [])

  // Dragging the frame by clicking empty space in outerRef
  useEffect(() => {
    let cleanup: (() => void) | undefined
    let rafId = 0
    const attach = () => {
      const el = outerRef.current
      const c = containerRef.current
      if (!el || !c) {
        if (!rafId) console.log('[useMeshFrame] drag listeners waiting for refs...')
        rafId = requestAnimationFrame(attach)
        return
      }
      console.log('[useMeshFrame] drag listeners attached')
    let dragging = false
    let lastX = 0
    let lastY = 0
    const onDown = (e: MouseEvent) => {
      if ((e.buttons & 1) !== 1) return
      const target = e.target as Element
      if (target.closest('[data-resize]') || target.closest('[data-handle="true"]')) return
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      console.log('[useMeshFrame] drag start', { x: lastX, y: lastY })
    }
    const onMove = (e: MouseEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      const crect = c.getBoundingClientRect()
      setFrame((f) => {
        let nx = f.x + dx
        let ny = f.y + dy
        const minX = Math.min(0, Math.floor(crect.width - f.width))
        const maxX = Math.max(0, Math.floor(crect.width - f.width))
        const minY = Math.min(0, Math.floor(crect.height - f.height))
        const maxY = Math.max(0, Math.floor(crect.height - f.height))
        nx = Math.min(Math.max(nx, minX), maxX)
        ny = Math.min(Math.max(ny, minY), maxY)
        console.log('[useMeshFrame] drag move', { dx, dy, next: { x: nx, y: ny } })
        return { ...f, x: nx, y: ny }
      })
      lastX = e.clientX
      lastY = e.clientY
    }
    const onUp = () => (dragging = false)
      el.addEventListener('mousedown', onDown)
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      cleanup = () => {
        console.log('[useMeshFrame] drag listeners detached')
        el.removeEventListener('mousedown', onDown)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
    }
    attach()
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      cleanup?.()
    }
  }, [])

  // Resizing via handles
  useEffect(() => {
    let cleanup: (() => void) | undefined
    let rafId = 0
    const attach = () => {
      const el = outerRef.current
      const c = containerRef.current
      if (!el || !c) {
        if (!rafId) console.log('[useMeshFrame] resize listeners waiting for refs...')
        rafId = requestAnimationFrame(attach)
        return
      }
      console.log('[useMeshFrame] resize listeners attached')
    let resizing = false
    let handle: string | null = null
    let startX = 0
    let startY = 0
    let start = { x: 0, y: 0, w: 0, h: 0, ar: 1 }
    const onDown = (e: MouseEvent) => {
      const target = e.target as Element
      const h = target.closest('[data-resize]') as HTMLElement | null
      if (!h) {
        console.log('[useMeshFrame] resize mousedown ignored (no handle)')
        return
      }
      e.preventDefault()
      resizing = true
      handle = h.getAttribute('data-resize')
      startX = e.clientX
      startY = e.clientY
      const curr = frameRef.current
      start = { x: curr.x, y: curr.y, w: curr.width, h: curr.height, ar: Math.max(0.01, curr.width / curr.height) }
      const crect = c.getBoundingClientRect()
      console.log('[useMeshFrame] resize start', {
        handle,
        startX,
        startY,
        start,
        container: { w: crect.width, h: crect.height },
      })
    }
    const onMove = (e: MouseEvent) => {
      const currentHandle = handle
      if (!resizing || !currentHandle) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      const crect = c.getBoundingClientRect()
      setFrame((_f) => {
        let x = start.x
        let y = start.y
        let w = start.w
        let h = start.h
        const isN = currentHandle.includes('n')
        const isS = currentHandle.includes('s')
        const isE = currentHandle.includes('e')
        const isW = currentHandle.includes('w')
        if (isE) w = start.w + dx
        if (isS) h = start.h + dy
        if (isW) {
          const nw = start.w - dx
          x = start.x + (start.w - nw)
          w = nw
        }
        if (isN) {
          const nh = start.h - dy
          y = start.y + (start.h - nh)
          h = nh
        }
        if (e.shiftKey) {
          const ar = start.ar
          if ((isE || isW) && !(isN || isS)) {
            h = w / ar
            y = start.y + (start.h - h) / 2
          } else if ((isN || isS) && !(isE || isW)) {
            w = h * ar
            x = start.x + (start.w - w) / 2
          } else {
            const wFromH = h * ar
            const hFromW = w / ar
            if (Math.abs(w - start.w) > Math.abs(h - start.h)) {
              h = hFromW
            } else {
              w = wFromH
            }
            if (isW) x = start.x + (start.w - w)
            if (isN) y = start.y + (start.h - h)
          }
        }
        const minW = 50
        const minH = 50
        const maxW = Math.floor(crect.width)
        const maxH = Math.floor(crect.height)
        const unclamped = { x, y, w, h }
        w = Math.max(minW, Math.min(maxW, w))
        h = Math.max(minH, Math.min(maxH, h))
        x = Math.min(Math.max(x, 0), Math.floor(crect.width - w))
        y = Math.min(Math.max(y, 0), Math.floor(crect.height - h))
        console.log('[useMeshFrame] resize move', {
          handle: currentHandle,
          dx,
          dy,
          shift: e.shiftKey,
          unclamped,
          next: { x, y, w, h },
          container: { w: crect.width, h: crect.height },
        })
        return { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) }
      })
    }
    const onUp = () => {
      resizing = false
      handle = null
    }
    const onUpCommit = () => {
      const curr = frameRef.current
      onCommitSizeRef.current?.({ width: curr.width, height: curr.height })
      console.log('[useMeshFrame] resize end', curr)
    }
      el.addEventListener('mousedown', onDown)
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      window.addEventListener('mouseup', onUpCommit)
      cleanup = () => {
        console.log('[useMeshFrame] resize listeners detached')
        el.removeEventListener('mousedown', onDown)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        window.removeEventListener('mouseup', onUpCommit)
      }
    }
    attach()
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      cleanup?.()
    }
  }, [])

  return { containerRef, outerRef, frame }
}


