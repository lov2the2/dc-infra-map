'use client'
import { useState, useEffect, useMemo } from 'react'

/**
 * Hook for managing dependent (cascading) select data fetching.
 * Fetches items from a URL based on a parent value.
 * Returns empty array when parentValue is null/undefined.
 * Uses derived state for loading to avoid synchronous setState inside effects.
 */
export function useCascadingSelect<T>(
    parentValue: string | undefined | null,
    fetchUrl: (parentId: string) => string,
    responseKey: string = 'data'
) {
    const [fetchedItems, setFetchedItems] = useState<T[]>([])
    const [fetchedFor, setFetchedFor] = useState<string | null>(null)

    // Derive items: return empty when parentValue changes (before fetch completes)
    const items = useMemo(() => {
        if (!parentValue || parentValue !== fetchedFor) return []
        return fetchedItems
    }, [parentValue, fetchedFor, fetchedItems])

    // Derive loading: true when parentValue exists but fetch hasn't resolved yet
    const isLoading = !!parentValue && parentValue !== fetchedFor

    useEffect(() => {
        if (!parentValue) return

        let cancelled = false

        fetch(fetchUrl(parentValue))
            .then(r => r.json())
            .then(data => {
                if (!cancelled) {
                    setFetchedItems(data[responseKey] ?? data ?? [])
                    setFetchedFor(parentValue)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setFetchedItems([])
                    setFetchedFor(parentValue)
                }
            })

        return () => {
            cancelled = true
        }
    }, [parentValue, fetchUrl, responseKey])

    return { items, isLoading }
}
