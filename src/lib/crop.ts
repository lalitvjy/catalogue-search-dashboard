export type CropSelection = { rect: { x: number; y: number; width: number; height: number }; containerWidth: number; containerHeight: number }

export async function cropFromBlob(sourceBlob: Blob, selection: CropSelection, naturalWidth: number, naturalHeight: number): Promise<Blob> {
	// Map from displayed container to natural image coordinates while preserving object-contain behavior
	const { rect, containerWidth, containerHeight } = selection

	// Compute how the image fits inside the container with object-contain
	const imageAspect = naturalWidth / naturalHeight
	const containerAspect = containerWidth / containerHeight

	let drawnWidth: number
	let drawnHeight: number
	let offsetX: number
	let offsetY: number

	if (imageAspect > containerAspect) {
		// Image is wider; width matches container width
		drawnWidth = containerWidth
		drawnHeight = containerWidth / imageAspect
		offsetX = 0
		offsetY = (containerHeight - drawnHeight) / 2
	} else {
		// Image is taller; height matches container height
		drawnHeight = containerHeight
		drawnWidth = containerHeight * imageAspect
		offsetY = 0
		offsetX = (containerWidth - drawnWidth) / 2
	}

	// Clip selection to the drawn image area
	const selX = Math.max(rect.x, offsetX)
	const selY = Math.max(rect.y, offsetY)
	const selRight = Math.min(rect.x + rect.width, offsetX + drawnWidth)
	const selBottom = Math.min(rect.y + rect.height, offsetY + drawnHeight)

	const clippedWidth = Math.max(0, selRight - selX)
	const clippedHeight = Math.max(0, selBottom - selY)
	if (clippedWidth < 5 || clippedHeight < 5) {
		throw new Error('Crop too small')
	}

	// Map clipped selection to natural coordinates
	const scaleX = naturalWidth / drawnWidth
	const scaleY = naturalHeight / drawnHeight

	const sx = Math.floor((selX - offsetX) * scaleX)
	const sy = Math.floor((selY - offsetY) * scaleY)
	const sWidth = Math.floor(clippedWidth * scaleX)
	const sHeight = Math.floor(clippedHeight * scaleY)

	// Draw crop
	const imageObjectUrl = URL.createObjectURL(sourceBlob)
	try {
		const imageEl = await new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image()
			img.onload = () => resolve(img)
			img.onerror = reject
			img.src = imageObjectUrl
		})

		const canvas = document.createElement('canvas')
		canvas.width = Math.max(1, sWidth)
		canvas.height = Math.max(1, sHeight)
		const ctx = canvas.getContext('2d')
		if (!ctx) throw new Error('Canvas not supported')
		ctx.imageSmoothingQuality = 'high'
		ctx.drawImage(imageEl, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight)

		const blob: Blob = await new Promise((resolve, reject) => {
			canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), 'image/jpeg', 0.92)
		})
		return blob
	} finally {
		URL.revokeObjectURL(imageObjectUrl)
	}
}


