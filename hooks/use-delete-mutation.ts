'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UseDeleteMutationOptions {
    endpoint: string
    redirectPath?: string
    onSuccess?: () => void
    onError?: (error: string) => void
}

export function useDeleteMutation({
    endpoint,
    redirectPath,
    onSuccess,
    onError,
}: UseDeleteMutationOptions) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleDelete = async (): Promise<boolean> => {
        setIsLoading(true)
        try {
            const response = await fetch(endpoint, { method: 'DELETE' })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                onError?.(errorData?.error ?? 'Delete failed')
                return false
            }

            onSuccess?.()

            if (redirectPath) {
                router.push(redirectPath)
                router.refresh()
            } else {
                router.refresh()
            }

            return true
        } catch (e) {
            onError?.(e instanceof Error ? e.message : 'Network error')
            return false
        } finally {
            setIsLoading(false)
        }
    }

    return { handleDelete, isLoading }
}
