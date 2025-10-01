'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import type { CropSelection as LibCropSelection } from '@/lib/crop'

export type CropRect = { x: number; y: number; width: number; height: number }
export type CropSelection = { rect: CropRect; containerWidth: number; containerHeight: number }

interface CropOverlayProps {
	imageUrl: string
	onCropEnd: (selection: LibCropSelection) => void
}

export default function CropOverlay({ imageUrl, onCropEnd }: CropOverlayProps) {
	const containerRef = useRef<HTMLDivElement | null>(null)
	const [dragging, setDragging] = useState(false)
	const [start, setStart] = useState<{ x: number; y: number } | null>(null)
	const [rect, setRect] = useState<CropRect | null>(null)

	const [resizing, setResizing] = useState<
		| null
		| {
			dir: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
			originRect: CropRect
			originPointer: { x: number; y: number }
		}
	>(null)

	const onPointerDown = useCallback((e: React.PointerEvent) => {
		if (!containerRef.current) return
		const bounds = containerRef.current.getBoundingClientRect()
		const x = Math.max(0, Math.min(e.clientX - bounds.left, bounds.width))
		const y = Math.max(0, Math.min(e.clientY - bounds.top, bounds.height))
		if (!rect || x < rect.x || y < rect.y || x > rect.x + rect.width || y > rect.y + rect.height) {
			setStart({ x, y })
			setRect({ x, y, width: 0, height: 0 })
			setDragging(true)
		}
	}, [rect])

	const onPointerMove = useCallback((e: React.PointerEvent) => {
		if (!containerRef.current) return
		const bounds = containerRef.current.getBoundingClientRect()
		const currX = Math.max(0, Math.min(e.clientX - bounds.left, bounds.width))
		const currY = Math.max(0, Math.min(e.clientY - bounds.top, bounds.height))
		if (dragging && start) {
			const x = Math.min(start.x, currX)
			const y = Math.min(start.y, currY)
			const width = Math.abs(currX - start.x)
			const height = Math.abs(currY - start.y)
			setRect({ x, y, width, height })
			return
		}
		if (resizing && rect) {
			const minSize = 20
			let { x, y, width, height } = { ...rect }
			const dx = currX - resizing.originPointer.x
			const dy = currY - resizing.originPointer.y
			switch (resizing.dir) {
				case 'e':
					width = Math.max(minSize, resizing.originRect.width + dx)
					break
				case 's':
					height = Math.max(minSize, resizing.originRect.height + dy)
					break
				case 'w':
					{
						const newW = Math.max(minSize, resizing.originRect.width - dx)
						const newX = resizing.originRect.x + (resizing.originRect.width - newW)
						x = Math.max(0, newX)
						width = Math.min(bounds.width - x, newW)
					}
					break
				case 'n':
					{
						const newH = Math.max(minSize, resizing.originRect.height - dy)
						const newY = resizing.originRect.y + (resizing.originRect.height - newH)
						y = Math.max(0, newY)
						height = Math.min(bounds.height - y, newH)
					}
					break
				case 'ne':
					{
						const newH = Math.max(minSize, resizing.originRect.height - dy)
						const newY = resizing.originRect.y + (resizing.originRect.height - newH)
						y = Math.max(0, newY)
						height = Math.min(bounds.height - y, newH)
						width = Math.max(minSize, resizing.originRect.width + dx)
					}
					break
				case 'nw':
					{
						const newH = Math.max(minSize, resizing.originRect.height - dy)
						const newY = resizing.originRect.y + (resizing.originRect.height - newH)
						y = Math.max(0, newY)
						height = Math.min(bounds.height - y, newH)
						const newW = Math.max(minSize, resizing.originRect.width - dx)
						const newX = resizing.originRect.x + (resizing.originRect.width - newW)
						x = Math.max(0, newX)
						width = Math.min(bounds.width - x, newW)
					}
					break
				case 'se':
					{
						width = Math.max(minSize, resizing.originRect.width + dx)
						height = Math.max(minSize, resizing.originRect.height + dy)
					}
					break
				case 'sw':
					{
						const newW = Math.max(minSize, resizing.originRect.width - dx)
						const newX = resizing.originRect.x + (resizing.originRect.width - newW)
						x = Math.max(0, newX)
						width = Math.min(bounds.width - x, newW)
						height = Math.max(minSize, resizing.originRect.height + dy)
					}
					break
			}
			width = Math.min(width, bounds.width - x)
			height = Math.min(height, bounds.height - y)
			setRect({ x, y, width, height })
		}
	}, [dragging, start, resizing, rect])

	const onPointerUp = useCallback(() => {
		if ((dragging || resizing) && rect && rect.width >= 5 && rect.height >= 5 && containerRef.current) {
			const bounds = containerRef.current.getBoundingClientRect()
			onCropEnd({ rect, containerWidth: bounds.width, containerHeight: bounds.height })
		}
		setDragging(false)
		setStart(null)
		setResizing(null)
	}, [dragging, rect, onCropEnd, resizing])

	const selection = useMemo(() => {
		if (!rect) return null
		const handleClass = 'absolute w-3.5 h-3.5 bg-white border border-blue-500 rounded shadow'
		const offset = 7
		return (
			<>
				<div
					className="absolute border-2 border-blue-500/80 rounded-md shadow-[0_0_0_2px_rgba(59,130,246,0.15)]"
					style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height, backgroundColor: 'rgba(255,255,255,0.2)' }}
				/>
				<div
					className={handleClass}
					style={{ left: rect.x - offset, top: rect.y - offset, cursor: 'nwse-resize' }}
					onPointerDown={(e) => { e.stopPropagation(); setResizing({ dir: 'nw', originRect: rect, originPointer: { x: e.clientX - (containerRef.current?.getBoundingClientRect().left || 0), y: e.clientY - (containerRef.current?.getBoundingClientRect().top || 0) } }) }}
				/>
				<div
					className={handleClass}
					style={{ left: rect.x + rect.width - offset, top: rect.y - offset, cursor: 'nesw-resize' }}
					onPointerDown={(e) => { e.stopPropagation(); setResizing({ dir: 'ne', originRect: rect, originPointer: { x: e.clientX - (containerRef.current?.getBoundingClientRect().left || 0), y: e.clientY - (containerRef.current?.getBoundingClientRect().top || 0) } }) }}
				/>
				<div
					className={handleClass}
					style={{ left: rect.x - offset, top: rect.y + rect.height - offset, cursor: 'nesw-resize' }}
					onPointerDown={(e) => { e.stopPropagation(); setResizing({ dir: 'sw', originRect: rect, originPointer: { x: e.clientX - (containerRef.current?.getBoundingClientRect().left || 0), y: e.clientY - (containerRef.current?.getBoundingClientRect().top || 0) } }) }}
				/>
				<div
					className={handleClass}
					style={{ left: rect.x + rect.width - offset, top: rect.y + rect.height - offset, cursor: 'nwse-resize' }}
					onPointerDown={(e) => { e.stopPropagation(); setResizing({ dir: 'se', originRect: rect, originPointer: { x: e.clientX - (containerRef.current?.getBoundingClientRect().left || 0), y: e.clientY - (containerRef.current?.getBoundingClientRect().top || 0) } }) }}
				/>
				<div
					className={handleClass}
					style={{ left: rect.x + rect.width / 2 - offset, top: rect.y - offset, cursor: 'ns-resize' }}
					onPointerDown={(e) => { e.stopPropagation(); setResizing({ dir: 'n', originRect: rect, originPointer: { x: e.clientX - (containerRef.current?.getBoundingClientRect().left || 0), y: e.clientY - (containerRef.current?.getBoundingClientRect().top || 0) } }) }}
				/>
				<div
					className={handleClass}
					style={{ left: rect.x + rect.width / 2 - offset, top: rect.y + rect.height - offset, cursor: 'ns-resize' }}
					onPointerDown={(e) => { e.stopPropagation(); setResizing({ dir: 's', originRect: rect, originPointer: { x: e.clientX - (containerRef.current?.getBoundingClientRect().left || 0), y: e.clientY - (containerRef.current?.getBoundingClientRect().top || 0) } }) }}
				/>
				<div
					className={handleClass}
					style={{ left: rect.x - offset, top: rect.y + rect.height / 2 - offset, cursor: 'ew-resize' }}
					onPointerDown={(e) => { e.stopPropagation(); setResizing({ dir: 'w', originRect: rect, originPointer: { x: e.clientX - (containerRef.current?.getBoundingClientRect().left || 0), y: e.clientY - (containerRef.current?.getBoundingClientRect().top || 0) } }) }}
				/>
				<div
					className={handleClass}
					style={{ left: rect.x + rect.width - offset, top: rect.y + rect.height / 2 - offset, cursor: 'ew-resize' }}
					onPointerDown={(e) => { e.stopPropagation(); setResizing({ dir: 'e', originRect: rect, originPointer: { x: e.clientX - (containerRef.current?.getBoundingClientRect().left || 0), y: e.clientY - (containerRef.current?.getBoundingClientRect().top || 0) } }) }}
				/>
			</>
		)
	}, [rect])

	return (
		<div className="relative w-full h-full select-none">
			<div
				ref={containerRef}
				className="relative w-full h-full cursor-crosshair"
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerLeave={onPointerUp}
				role="img"
				aria-label="Crop selection area"
			>
				<img src={imageUrl} alt="Uploaded image" className="w-full h-full object-contain" style={{ aspectRatio: '1 / 1', backgroundColor: '#f3f4f6' }} />
				{/* Backdrop darkening around selection */}
				{rect && (
					<>
						<div className="absolute bg-black/50" style={{ left: 0, top: 0, width: '100%', height: rect.y }} />
						<div className="absolute bg-black/50" style={{ left: 0, top: rect.y, width: rect.x, height: rect.height }} />
						<div className="absolute bg-black/50" style={{ left: rect.x + rect.width, top: rect.y, right: 0, height: rect.height }} />
						<div className="absolute bg-black/50" style={{ left: 0, top: rect.y + rect.height, width: '100%', bottom: 0 }} />
					</>
				)}
				{selection}
			</div>
		</div>
	)
}


