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
    isNull: vi.fn((col: unknown) => ({ type: 'isNull', column: col })),
}))

import { db } from '@/db'
import { evaluateRackCapacity } from '@/lib/alerts/evaluators/rack-capacity'

function makeRule(overrides: Partial<AlertRule> = {}): AlertRule {
    return {
        id: 'rule-003',
        name: 'Rack Capacity',
        ruleType: 'rack_capacity',
        resource: 'rack',
        conditionField: 'usage_percent',
        conditionOperator: 'gt',
        thresholdValue: '80',
        severity: 'warning',
        enabled: true,
        notificationChannels: [],
        cooldownMinutes: 30,
        createdBy: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        ...overrides,
    }
}

describe('evaluateRackCapacity', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns empty array when no racks exist', async () => {
        const mockWhere = vi.fn().mockResolvedValue([])
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
        (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom })

        const result = await evaluateRackCapacity(makeRule())
        expect(result).toEqual([])
    })

    it('triggers alert when rack capacity exceeds threshold', async () => {
        const racks = [{ id: 'rack-001', name: 'Rack A', uHeight: 42, deletedAt: null }]
        // Devices occupying 36U out of 42U = 85.7%
        const rackDevices = [
            { uHeight: 2 }, { uHeight: 2 }, { uHeight: 2 },
            { uHeight: 4 }, { uHeight: 4 }, { uHeight: 4 },
            { uHeight: 4 }, { uHeight: 4 }, { uHeight: 4 },
            { uHeight: 2 }, { uHeight: 2 }, { uHeight: 2 },
        ]

        let callCount = 0;
        (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
            callCount++
            if (callCount === 1) {
                return {
                    from: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue(racks),
                    }),
                }
            }
            return {
                from: vi.fn().mockReturnValue({
                    innerJoin: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue(rackDevices),
                    }),
                }),
            }
        })

        const rule = makeRule({ conditionOperator: 'gt', thresholdValue: '80' })
        const result = await evaluateRackCapacity(rule)

        expect(result).toHaveLength(1)
        expect(result[0].ruleId).toBe('rule-003')
        expect(result[0].resourceType).toBe('rack')
        expect(result[0].resourceId).toBe('rack-001')
        expect(result[0].resourceName).toBe('Rack A')
        expect(parseFloat(result[0].actualValue!)).toBeGreaterThan(80)
    })

    it('does not trigger when rack capacity is below threshold', async () => {
        const racks = [{ id: 'rack-001', name: 'Rack A', uHeight: 42, deletedAt: null }]
        // 10U out of 42U = 23.8%
        const rackDevices = [{ uHeight: 4 }, { uHeight: 2 }, { uHeight: 4 }]

        let callCount = 0;
        (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
            callCount++
            if (callCount === 1) {
                return {
                    from: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue(racks),
                    }),
                }
            }
            return {
                from: vi.fn().mockReturnValue({
                    innerJoin: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue(rackDevices),
                    }),
                }),
            }
        })

        const rule = makeRule({ conditionOperator: 'gt', thresholdValue: '80' })
        const result = await evaluateRackCapacity(rule)

        expect(result).toHaveLength(0)
    })

    it('handles empty rack (no devices)', async () => {
        const racks = [{ id: 'rack-001', name: 'Rack A', uHeight: 42, deletedAt: null }]

        let callCount = 0;
        (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
            callCount++
            if (callCount === 1) {
                return {
                    from: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue(racks),
                    }),
                }
            }
            return {
                from: vi.fn().mockReturnValue({
                    innerJoin: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([]),
                    }),
                }),
            }
        })

        const rule = makeRule({ conditionOperator: 'gt', thresholdValue: '80' })
        const result = await evaluateRackCapacity(rule)

        // 0U / 42U = 0% < 80%
        expect(result).toHaveLength(0)
    })

    it('triggers with lte operator for low utilization check', async () => {
        const racks = [{ id: 'rack-001', name: 'Rack A', uHeight: 42, deletedAt: null }]
        const rackDevices = [{ uHeight: 2 }] // 2U / 42U = 4.8%

        let callCount = 0;
        (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
            callCount++
            if (callCount === 1) {
                return {
                    from: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue(racks),
                    }),
                }
            }
            return {
                from: vi.fn().mockReturnValue({
                    innerJoin: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue(rackDevices),
                    }),
                }),
            }
        })

        const rule = makeRule({ conditionOperator: 'lte', thresholdValue: '10' })
        const result = await evaluateRackCapacity(rule)

        // 4.8% <= 10%
        expect(result).toHaveLength(1)
    })

    it('evaluates multiple racks correctly', async () => {
        const racks = [
            { id: 'rack-001', name: 'Full Rack', uHeight: 42, deletedAt: null },
            { id: 'rack-002', name: 'Empty Rack', uHeight: 42, deletedAt: null },
        ]

        let callCount = 0;
        (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
            callCount++
            if (callCount === 1) {
                return {
                    from: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue(racks),
                    }),
                }
            }
            // First rack: 36U used (85.7%)
            if (callCount === 2) {
                return {
                    from: vi.fn().mockReturnValue({
                        innerJoin: vi.fn().mockReturnValue({
                            where: vi.fn().mockResolvedValue([
                                { uHeight: 4 }, { uHeight: 4 }, { uHeight: 4 },
                                { uHeight: 4 }, { uHeight: 4 }, { uHeight: 4 },
                                { uHeight: 4 }, { uHeight: 4 }, { uHeight: 4 },
                            ]),
                        }),
                    }),
                }
            }
            // Second rack: 0U used (0%)
            return {
                from: vi.fn().mockReturnValue({
                    innerJoin: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([]),
                    }),
                }),
            }
        })

        const rule = makeRule({ conditionOperator: 'gt', thresholdValue: '80' })
        const result = await evaluateRackCapacity(rule)

        // Only rack-001 should trigger (85.7% > 80%)
        expect(result).toHaveLength(1)
        expect(result[0].resourceId).toBe('rack-001')
    })
})
