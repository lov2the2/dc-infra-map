'use client'
import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function useSearchParamsFilter(basePath: string) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const updateFilter = useCallback((key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`${basePath}?${params.toString()}`)
    }, [router, searchParams, basePath])

    const clearFilters = useCallback(() => {
        router.push(basePath)
    }, [router, basePath])

    const getFilter = useCallback((key: string) => {
        return searchParams.get(key)
    }, [searchParams])

    return { updateFilter, clearFilters, getFilter }
}
