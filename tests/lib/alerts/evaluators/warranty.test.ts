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
    isNotNull: vi.fn((col: unknown) => ({ type: 'isNotNull', column: col })),
}))

import { db } from '@/db'
import { evaluateWarrantyExpiry } from '@/lib/alerts/evaluators/warranty'

function makeRule(overrides: Partial<AlertRule> = {}): AlertRule {
    return {
        id: 'rule-002',
        name: 'Warranty Expiry',
        ruleType: 'warranty_expiry',
        resource: 'device',
        conditionField: 'warranty_days',
        conditionOperator: 'lte',
        thresholdValue: '30',
        severity: 'warning',
        enabled: true,
        notificationChannels: [],
        cooldownMinutes: 60,
        createdBy: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        ...overrides,
    }
}

describe('evaluateWarrantyExpiry', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns empty array when no devices have warranty dates', async () => {
        const mockWhere = vi.fn().mockResolvedValue([])
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
        const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
        (db.select as ReturnType<typeof vi.fn>).mockReturnValue(mockSelect())

        const result = await evaluateWarrantyExpiry(makeRule())
        expect(result).toEqual([])
    })

    it('triggers alert for device with warranty expiring within threshold', async () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 15) // 15 days from now

        const devicesWithWarranty = [
            { id: 'dev-001', name: 'Server A', warrantyExpiresAt: futureDate },
        ]

        const mockWhere = vi.fn().mockResolvedValue(devicesWithWarranty)
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
        (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom })

        const rule = makeRule({ thresholdValue: '30' })
        const result = await evaluateWarrantyExpiry(rule)

        // 15 days <= 30 days threshold
        expect(result).toHaveLength(1)
        expect(result[0].ruleId).toBe('rule-002')
        expect(result[0].resourceType).toBe('device')
        expect(result[0].resourceId).toBe('dev-001')
        expect(result[0].resourceName).toBe('Server A')
        expect(result[0].message).toContain('expires in')
    })

    it('triggers alert for device with expired warranty', async () => {
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 10) // 10 days ago

        const devicesWithWarranty = [
            { id: 'dev-002', name: 'Server B', warrantyExpiresAt: pastDate },
        ]

        const mockWhere = vi.fn().mockResolvedValue(devicesWithWarranty)
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
        (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom })

        const rule = makeRule({ thresholdValue: '30' })
        const result = await evaluateWarrantyExpiry(rule)

        expect(result).toHaveLength(1)
        expect(result[0].message).toContain('expired')
        expect(parseInt(result[0].actualValue!)).toBeLessThan(0)
    })

    it('does not trigger for device with warranty well beyond threshold', async () => {
        const farFuture = new Date()
        farFuture.setDate(farFuture.getDate() + 365) // 1 year from now

        const devicesWithWarranty = [
            { id: 'dev-003', name: 'Server C', warrantyExpiresAt: farFuture },
        ]

        const mockWhere = vi.fn().mockResolvedValue(devicesWithWarranty)
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
        (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom })

        const rule = makeRule({ thresholdValue: '30' })
        const result = await evaluateWarrantyExpiry(rule)

        // 365 days > 30 days threshold
        expect(result).toHaveLength(0)
    })

    it('evaluates multiple devices correctly', async () => {
        const soon = new Date()
        soon.setDate(soon.getDate() + 5)
        const farAway = new Date()
        farAway.setDate(farAway.getDate() + 200)
        const expired = new Date()
        expired.setDate(expired.getDate() - 3)

        const devicesWithWarranty = [
            { id: 'dev-001', name: 'Expiring Soon', warrantyExpiresAt: soon },
            { id: 'dev-002', name: 'Far Away', warrantyExpiresAt: farAway },
            { id: 'dev-003', name: 'Already Expired', warrantyExpiresAt: expired },
        ]

        const mockWhere = vi.fn().mockResolvedValue(devicesWithWarranty)
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
        (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom })

        const rule = makeRule({ thresholdValue: '30' })
        const result = await evaluateWarrantyExpiry(rule)

        // dev-001 (5 days) and dev-003 (-3 days) should trigger, dev-002 (200 days) should not
        expect(result).toHaveLength(2)
        expect(result.map(r => r.resourceId).sort()).toEqual(['dev-001', 'dev-003'])
    })
})
