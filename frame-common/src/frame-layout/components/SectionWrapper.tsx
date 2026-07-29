import React, { useContext } from 'react'
import { PageContext } from '../contexts'
import { cn } from '../cn'
import type { ParamSpec } from '../types'

export interface SectionWrapperProps {
  name?: string
  condition?: ParamSpec
  className?: string
  tag?: 'div' | 'section' | 'header' | 'footer' | 'main' | 'aside'
  children?: React.ReactNode
  resizable?: 'left' | 'right' | false
  minWidth?: number
  maxWidth?: number
  defaultWidth?: number
  onResize?: (width: number) => void
}

let sectionCount = 0

export const SectionWrapper = (props: SectionWrapperProps) => {
  const name = props.name || `section-${sectionCount++}`
  const pageContext = useContext(PageContext)

  const condition = props.condition
  if (condition && Object.keys(condition).length > 0) {
    if (!pageContext) return null
    if (!pageContext.matchPageParams(condition, `Section[${name}]`)) {
      return null
    }
  }

  const {
    tag = 'section',
    className,
    resizable = false,
    minWidth = 200,
    maxWidth = 800,
    defaultWidth = 300,
    onResize,
    children,
  } = props

  let isResizing = false

  const [width, setWidth] = React.useState(defaultWidth)
  const sectionRef = React.useRef<HTMLDivElement>(null)
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const startXRef = React.useRef(0)
  const startWidthRef = React.useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!resizable) return
    e.preventDefault()
    isResizing = true
    wrapperRef.current?.classList.add('resizing')
    startXRef.current = e.clientX
    startWidthRef.current = width
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    const deltaX = e.clientX - startXRef.current
    const newWidth =
      resizable === 'right'
        ? startWidthRef.current + deltaX
        : startWidthRef.current - deltaX
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
    setWidth(clampedWidth)
    onResize?.(clampedWidth)
  }

  const handleMouseUp = () => {
    isResizing = false
    wrapperRef.current?.classList.remove('resizing')
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const sectionStyle: React.CSSProperties = resizable
    ? {
        width: `${width}px`,
        minWidth: `${minWidth}px`,
        maxWidth: `${maxWidth}px`,
        position: 'relative',
        flexShrink: 0,
      }
    : {}

  const sectionProps = {
    ref: sectionRef,
    className: cn('frame-section-wrapper', className),
    'data-section-params': `${name}:${JSON.stringify(props.condition) || ''}`,
    style: sectionStyle,
  }

  if (!resizable) {
    return React.createElement(tag, sectionProps, children)
  }

  return (
    <div
      ref={wrapperRef}
      className={`frame-resizable-wrapper frame-resizable-${resizable}`}
    >
      {React.createElement(tag, sectionProps, children)}
      <div className="frame-resize-handle" onMouseDown={handleMouseDown} />
    </div>
  )
}
