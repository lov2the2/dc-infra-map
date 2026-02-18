import { describe, it, expect } from 'vitest'
import {
    accessLogCreateSchema,
    accessLogCheckOutSchema,
    equipmentMovementCreateSchema,
    equipmentMovementUpdateSchema,
} from '@/lib/validators/access'

describe('accessLogCreateSchema', () => {
    describe('valid data', () => {
        it('parses a minimal valid access log', () => {
            const input = {
                siteId: 'site-001',
                personnelName: 'John Doe',
                accessType: 'visit' as const,
            }
            const result = accessLogCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('parses a fully specified access log', () => {
            const input = {
                siteId: 'site-001',
                personnelName: 'Jane Smith',
                company: 'ACME Corp',
                contactPhone: '+82-10-1234-5678',
                accessType: 'maintenance' as const,
                purpose: 'Server upgrade',
                escortName: 'Bob Kim',
                badgeNumber: 'V-1234',
                expectedCheckOutAt: '2026-02-18T18:00:00Z',
            }
            const result = accessLogCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('accepts all valid accessType values', () => {
            const types = ['visit', 'maintenance', 'delivery', 'emergency', 'tour'] as const
            for (const accessType of types) {
                const result = accessLogCreateSchema.safeParse({
                    siteId: 'site-001',
                    personnelName: 'Test User',
                    accessType,
                })
                expect(result.success, `accessType "${accessType}" should be valid`).toBe(true)
            }
        })

        it('accepts null for optional nullable fields', () => {
            const input = {
                siteId: 'site-001',
                personnelName: 'Test User',
                accessType: 'visit' as const,
                company: null,
                contactPhone: null,
                purpose: null,
                escortName: null,
                badgeNumber: null,
                expectedCheckOutAt: null,
            }
            const result = accessLogCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })
    })

    describe('invalid data', () => {
        it('rejects empty siteId', () => {
            const result = accessLogCreateSchema.safeParse({
                siteId: '',
                personnelName: 'Test',
                accessType: 'visit',
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing siteId', () => {
            const result = accessLogCreateSchema.safeParse({
                personnelName: 'Test',
                accessType: 'visit',
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty personnelName', () => {
            const result = accessLogCreateSchema.safeParse({
                siteId: 'site-001',
                personnelName: '',
                accessType: 'visit',
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing personnelName', () => {
            const result = accessLogCreateSchema.safeParse({
                siteId: 'site-001',
                accessType: 'visit',
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid accessType', () => {
            const result = accessLogCreateSchema.safeParse({
                siteId: 'site-001',
                personnelName: 'Test',
                accessType: 'unauthorized',
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing accessType', () => {
            const result = accessLogCreateSchema.safeParse({
                siteId: 'site-001',
                personnelName: 'Test',
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty object', () => {
            const result = accessLogCreateSchema.safeParse({})
            expect(result.success).toBe(false)
        })
    })
})

describe('accessLogCheckOutSchema', () => {
    it('accepts empty object', () => {
        const result = accessLogCheckOutSchema.safeParse({})
        expect(result.success).toBe(true)
    })

    it('accepts checkOutNote string', () => {
        const result = accessLogCheckOutSchema.safeParse({
            checkOutNote: 'Work completed',
        })
        expect(result.success).toBe(true)
    })

    it('accepts null checkOutNote', () => {
        const result = accessLogCheckOutSchema.safeParse({
            checkOutNote: null,
        })
        expect(result.success).toBe(true)
    })
})

describe('equipmentMovementCreateSchema', () => {
    describe('valid data', () => {
        it('parses a minimal valid movement', () => {
            const input = {
                siteId: 'site-001',
                movementType: 'install' as const,
            }
            const result = equipmentMovementCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('parses a fully specified movement', () => {
            const input = {
                siteId: 'site-001',
                rackId: 'rack-001',
                deviceId: 'device-001',
                movementType: 'relocate' as const,
                description: 'Moving server to new rack',
                serialNumber: 'SN-12345',
                assetTag: 'AT-001',
                notes: 'Handle with care',
            }
            const result = equipmentMovementCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('accepts all valid movementType values', () => {
            const types = ['install', 'remove', 'relocate', 'rma'] as const
            for (const movementType of types) {
                const result = equipmentMovementCreateSchema.safeParse({
                    siteId: 'site-001',
                    movementType,
                })
                expect(result.success, `movementType "${movementType}" should be valid`).toBe(true)
            }
        })

        it('accepts null for optional nullable fields', () => {
            const input = {
                siteId: 'site-001',
                movementType: 'install' as const,
                rackId: null,
                deviceId: null,
                description: null,
                serialNumber: null,
                assetTag: null,
                notes: null,
            }
            const result = equipmentMovementCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })
    })

    describe('invalid data', () => {
        it('rejects empty siteId', () => {
            const result = equipmentMovementCreateSchema.safeParse({
                siteId: '',
                movementType: 'install',
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing siteId', () => {
            const result = equipmentMovementCreateSchema.safeParse({
                movementType: 'install',
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid movementType', () => {
            const result = equipmentMovementCreateSchema.safeParse({
                siteId: 'site-001',
                movementType: 'swap',
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing movementType', () => {
            const result = equipmentMovementCreateSchema.safeParse({
                siteId: 'site-001',
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty object', () => {
            const result = equipmentMovementCreateSchema.safeParse({})
            expect(result.success).toBe(false)
        })
    })
})

describe('equipmentMovementUpdateSchema', () => {
    it('accepts empty object (all fields optional)', () => {
        const result = equipmentMovementUpdateSchema.safeParse({})
        expect(result.success).toBe(true)
    })

    it('accepts all valid status values', () => {
        const statuses = ['pending', 'approved', 'in_progress', 'completed', 'rejected'] as const
        for (const status of statuses) {
            const result = equipmentMovementUpdateSchema.safeParse({ status })
            expect(result.success, `status "${status}" should be valid`).toBe(true)
        }
    })

    it('rejects invalid status', () => {
        const result = equipmentMovementUpdateSchema.safeParse({ status: 'cancelled' })
        expect(result.success).toBe(false)
    })

    it('accepts notes update', () => {
        const result = equipmentMovementUpdateSchema.safeParse({
            notes: 'Updated status',
        })
        expect(result.success).toBe(true)
    })

    it('accepts null notes', () => {
        const result = equipmentMovementUpdateSchema.safeParse({
            notes: null,
        })
        expect(result.success).toBe(true)
    })
})
