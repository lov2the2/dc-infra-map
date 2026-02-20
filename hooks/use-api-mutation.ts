'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UseApiMutationOptions {
    endpoint: string
    redirectPath?: string
    method?: 'POST' | 'PUT' | 'PATCH'
    onSuccess?: (data: unknown) => void
    onError?: (error: string) => void
}

export function useApiMutation<TData = unknown, TResponse = unknown>({
    endpoint,
    redirectPath,
    method = 'POST',
    onSuccess,
    onError,
}: UseApiMutationOptions) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const mutate = async (data: TData): Promise<{ error?: string; data?: TResponse }> => {
        setIsLoading(true)
        try {
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                const errorMessage = errorData?.error ?? 'Operation failed'
                onError?.(errorMessage)
                return { error: errorMessage }
            }

            const responseData = await response.json().catch(() => ({}))
            onSuccess?.(responseData)

            if (redirectPath) {
                router.push(redirectPath)
                router.refresh()
            }

            return { data: responseData }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Network error'
            onError?.(errorMessage)
            return { error: errorMessage }
        } finally {
            setIsLoading(false)
        }
    }

    return { mutate, isLoading }
}
