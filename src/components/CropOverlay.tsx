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

	const onPointerDown = useCallback((e: React.PointerEvent) => {
		if (!containerRef.current) return
		const bounds = containerRef.current.getBoundingClientRect()
		const x = Math.max(0, Math.min(e.clientX - bounds.left, bounds.width))
		const y = Math.max(0, Math.min(e.clientY - bounds.top, bounds.height))
		setStart({ x, y })
		setRect({ x, y, width: 0, height: 0 })
		setDragging(true)
	}, [])

	const onPointerMove = useCallback((e: React.PointerEvent) => {
		if (!dragging || !start || !containerRef.current) return
		const bounds = containerRef.current.getBoundingClientRect()
		const currX = Math.max(0, Math.min(e.clientX - bounds.left, bounds.width))
		const currY = Math.max(0, Math.min(e.clientY - bounds.top, bounds.height))
		const x = Math.min(start.x, currX)
		const y = Math.min(start.y, currY)
		const width = Math.abs(currX - start.x)
		const height = Math.abs(currY - start.y)
		setRect({ x, y, width, height })
	}, [dragging, start])

	const onPointerUp = useCallback(() => {
		if (dragging && rect && rect.width >= 5 && rect.height >= 5 && containerRef.current) {
			const bounds = containerRef.current.getBoundingClientRect()
			onCropEnd({ rect, containerWidth: bounds.width, containerHeight: bounds.height })
		}
		setDragging(false)
		setStart(null)
	}, [dragging, rect, onCropEnd])

	const selection = useMemo(() => {
		if (!rect) return null
		return (
			<div
				className="absolute border-2 border-blue-500 bg-blue-200/20"
				style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
			/>
		)
	}, [rect])

	return (
		<div className="relative w-full h-full select-none">
			<div
				ref={containerRef}
				className="relative w-full h-full"
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerLeave={onPointerUp}
				role="img"
				aria-label="Crop selection area"
			>
				<img src={imageUrl} alt="Uploaded image" className="w-full h-full object-contain" style={{ aspectRatio: '1 / 1', backgroundColor: '#f3f4f6' }} />
				{selection}
			</div>
		</div>
	)
}


