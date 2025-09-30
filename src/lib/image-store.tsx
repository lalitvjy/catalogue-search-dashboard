'use client'

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

type ImageSource = {
	originalFile: File | null
	originalBlobUrl: string | null
	originalBlob: Blob | null
}

interface ImageStoreContextValue extends ImageSource {
	setFromFile: (file: File) => void
	setFromUrl: (url: string) => Promise<void>
	clear: () => void
}

const ImageStoreContext = createContext<ImageStoreContextValue | undefined>(undefined)

export function ImageStoreProvider({ children }: { children: React.ReactNode }) {
	const [originalFile, setOriginalFile] = useState<File | null>(null)
	const [originalBlob, setOriginalBlob] = useState<Blob | null>(null)
	const [originalBlobUrl, setOriginalBlobUrl] = useState<string | null>(null)
	const objectUrlRef = useRef<string | null>(null)

	const revokeIfNeeded = useCallback(() => {
		if (objectUrlRef.current) {
			URL.revokeObjectURL(objectUrlRef.current)
			objectUrlRef.current = null
		}
	}, [])

	const setFromFile = useCallback((file: File) => {
		revokeIfNeeded()
		setOriginalFile(file)
		setOriginalBlob(file)
		const url = URL.createObjectURL(file)
		objectUrlRef.current = url
		setOriginalBlobUrl(url)
	}, [revokeIfNeeded])

	const setFromUrl = useCallback(async (url: string) => {
		revokeIfNeeded()
		const res = await fetch(url, { cache: 'no-store' })
		if (!res.ok) throw new Error('Failed to fetch image URL')
		const blob = await res.blob()
		// Try to infer a filename
		const ext = (blob.type && blob.type.split('/')[1]) || 'jpg'
		const file = new File([blob], `image-from-url.${ext}`, { type: blob.type || 'image/jpeg' })
		setOriginalFile(file)
		setOriginalBlob(blob)
		const objUrl = URL.createObjectURL(blob)
		objectUrlRef.current = objUrl
		setOriginalBlobUrl(objUrl)
	}, [revokeIfNeeded])

	const clear = useCallback(() => {
		revokeIfNeeded()
		setOriginalFile(null)
		setOriginalBlob(null)
		setOriginalBlobUrl(null)
	}, [revokeIfNeeded])

	const value = useMemo<ImageStoreContextValue>(() => ({
		originalFile,
		originalBlob,
		originalBlobUrl,
		setFromFile,
		setFromUrl,
		clear,
	}), [originalFile, originalBlob, originalBlobUrl, setFromFile, setFromUrl, clear])

	return (
		<ImageStoreContext.Provider value={value}>{children}</ImageStoreContext.Provider>
	)
}

export function useImageStore(): ImageStoreContextValue {
	const ctx = useContext(ImageStoreContext)
	if (!ctx) throw new Error('useImageStore must be used within ImageStoreProvider')
	return ctx
}


