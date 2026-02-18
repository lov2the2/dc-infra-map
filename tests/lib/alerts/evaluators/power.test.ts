import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AlertRule } from '@/types/alerts'

// Mock the db module
vi.mock('@/db', () => ({
    db: {
        select: vi.fn(),
    },
}))

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => ({
    eq: vi.fn((_col: unknown, val: unknown) => ({ type: 'eq', value: val })),
    desc: vi.fn((col: unknown) => ({ type: 'desc', column: col })),
}))

import { db } from '@/db'
import { evaluatePowerThreshold } from '@/lib/alerts/evaluators/power'

function makeRule(overrides: Partial<AlertRule> = {}): AlertRule {
    return {
        id: 'rule-001',
        name: 'Power Threshold',
        ruleType: 'power_threshold',
        resource: 'power_feed',
        conditionField: 'usage_percent',
        conditionOperator: 'gt',
        thresholdValue: '80',
        severity: 'warning',
        enabled: true,
        notificationChannels: [],
        cooldownMinutes: 15,
        createdBy: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        ...overrides,
    }
}

describe('evaluatePowerThreshold', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns empty array when no feeds exist', async () => {
        const mockFrom = vi.fn().mockResolvedValue([])
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
        (db.select as ReturnType<typeof vi.fn>).mockReturnValue(mockSelect())

        const result = await evaluatePowerThreshold(makeRule())
        expect(result).toEqual([])
    })

    it('returns empty array when feed has no readings', async () => {
        const feeds = [{ id: 'feed-001', name: 'Feed A', ratedKw: 10 }]

        // First call: select feeds
        const mockLimit = vi.fn().mockResolvedValue([])
        const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
        const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
        const mockFromReadings = vi.fn().mockReturnValue({ where: mockWhere })

        let callCount = 0;
        (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
            callCount++
            if (callCount === 1) {
                return { from: vi.fn().mockResolvedValue(feeds) }
            }
            return { from: mockFromReadings }
        })

        const result = await evaluatePowerThreshold(makeRule())
        expect(result).toEqual([])
    })

    it('triggers alert when usage exceeds threshold', async () => {
        const feeds = [{ id: 'feed-001', name: 'Feed A', ratedKw: 10 }]
        const readings = [{ feedId: 'feed-001', powerKw: 9, recordedAt: new Date() }]

        let callCount = 0;
        (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
            callCount++
            if (callCount === 1) {
                return { from: vi.fn().mockResolvedValue(feeds) }
            }
            return {
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue(readings),
                        }),
                    }),
                }),
            }
        })

        const rule = makeRule({ conditionOperator: 'gt', thresholdValue: '80' })
        const result = await evaluatePowerThreshold(rule)

        // 9kW / 10kW = 90% > 80%
        expect(result).toHaveLength(1)
        expect(result[0].ruleId).toBe('rule-001')
        expect(result[0].severity).toBe('warning')
        expect(result[0].resourceType).toBe('power_feed')
        expect(result[0].resourceId).toBe('feed-001')
        expect(result[0].resourceName).toBe('Feed A')
        expect(parseFloat(result[0].actualValue!)).toBeCloseTo(90)
    })

    it('does not trigger when usage is below threshold', async () => {
        const feeds = [{ id: 'feed-001', name: 'Feed A', ratedKw: 10 }]
        const readings = [{ feedId: 'feed-001', powerKw: 5, recordedAt: new Date() }]

        let callCount = 0;
        (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
            callCount++
            if (callCount === 1) {
                return { from: vi.fn().mockResolvedValue(feeds) }
            }
            return {
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue(readings),
                        }),
                    }),
                }),
            }
        })

        const rule = makeRule({ conditionOperator: 'gt', thresholdValue: '80' })
        const result = await evaluatePowerThreshold(rule)

        // 5kW / 10kW = 50% < 80%
        expect(result).toHaveLength(0)
    })

    it('handles lte operator correctly', async () => {
        const feeds = [{ id: 'feed-001', name: 'Feed A', ratedKw: 10 }]
        const readings = [{ feedId: 'feed-001', powerKw: 1, recordedAt: new Date() }]

        let callCount = 0;
        (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
            callCount++
            if (callCount === 1) {
                return { from: vi.fn().mockResolvedValue(feeds) }
            }
            return {
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue(readings),
                        }),
                    }),
                }),
            }
        })

        const rule = makeRule({ conditionOperator: 'lte', thresholdValue: '20' })
        const result = await evaluatePowerThreshold(rule)

        // 1kW / 10kW = 10% <= 20%
        expect(result).toHaveLength(1)
    })
})
