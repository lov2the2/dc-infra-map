import { describe, it, expect } from 'vitest'
import { deviceCreateSchema, deviceUpdateSchema } from '@/lib/validators/device'

describe('deviceCreateSchema', () => {
    describe('valid data', () => {
        it('parses a minimal valid device', () => {
            const input = {
                name: 'web-server-01',
                deviceTypeId: 'abc-123',
            }
            const result = deviceCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('parses a fully specified valid device', () => {
            const input = {
                name: 'web-server-01',
                deviceTypeId: 'abc-123',
                rackId: 'rack-001',
                tenantId: 'tenant-001',
                status: 'active' as const,
                face: 'front' as const,
                position: 5,
                serialNumber: 'SN-12345',
                assetTag: 'AT-001',
                primaryIp: '192.168.1.1',
                description: 'Primary web server',
                reason: 'Initial deployment',
            }
            const result = deviceCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('accepts all valid status values', () => {
            const statuses = ['active', 'planned', 'staged', 'failed', 'decommissioning', 'decommissioned'] as const
            for (const status of statuses) {
                const result = deviceCreateSchema.safeParse({
                    name: 'server',
                    deviceTypeId: 'type-001',
                    status,
                })
                expect(result.success, `status "${status}" should be valid`).toBe(true)
            }
        })

        it('accepts all valid face values', () => {
            const faces = ['front', 'rear'] as const
            for (const face of faces) {
                const result = deviceCreateSchema.safeParse({
                    name: 'server',
                    deviceTypeId: 'type-001',
                    face,
                })
                expect(result.success, `face "${face}" should be valid`).toBe(true)
            }
        })

        it('accepts null for optional nullable fields', () => {
            const input = {
                name: 'server',
                deviceTypeId: 'type-001',
                rackId: null,
                tenantId: null,
                position: null,
                serialNumber: null,
                assetTag: null,
                primaryIp: null,
                description: null,
            }
            const result = deviceCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('accepts position as a positive integer', () => {
            const result = deviceCreateSchema.safeParse({
                name: 'server',
                deviceTypeId: 'type-001',
                position: 42,
            })
            expect(result.success).toBe(true)
        })
    })

    describe('invalid data', () => {
        it('rejects empty name', () => {
            const result = deviceCreateSchema.safeParse({
                name: '',
                deviceTypeId: 'type-001',
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing name', () => {
            const result = deviceCreateSchema.safeParse({
                deviceTypeId: 'type-001',
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty deviceTypeId', () => {
            const result = deviceCreateSchema.safeParse({
                name: 'server',
                deviceTypeId: '',
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing deviceTypeId', () => {
            const result = deviceCreateSchema.safeParse({
                name: 'server',
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid status value', () => {
            const result = deviceCreateSchema.safeParse({
                name: 'server',
                deviceTypeId: 'type-001',
                status: 'unknown',
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid face value', () => {
            const result = deviceCreateSchema.safeParse({
                name: 'server',
                deviceTypeId: 'type-001',
                face: 'side',
            })
            expect(result.success).toBe(false)
        })

        it('rejects position of 0 (must be >= 1)', () => {
            const result = deviceCreateSchema.safeParse({
                name: 'server',
                deviceTypeId: 'type-001',
                position: 0,
            })
            expect(result.success).toBe(false)
        })

        it('rejects negative position', () => {
            const result = deviceCreateSchema.safeParse({
                name: 'server',
                deviceTypeId: 'type-001',
                position: -1,
            })
            expect(result.success).toBe(false)
        })

        it('rejects non-integer position', () => {
            const result = deviceCreateSchema.safeParse({
                name: 'server',
                deviceTypeId: 'type-001',
                position: 2.5,
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty object', () => {
            const result = deviceCreateSchema.safeParse({})
            expect(result.success).toBe(false)
        })
    })
})

describe('deviceUpdateSchema', () => {
    it('accepts empty object (all fields optional)', () => {
        const result = deviceUpdateSchema.safeParse({})
        expect(result.success).toBe(true)
    })

    it('accepts partial update with only name', () => {
        const result = deviceUpdateSchema.safeParse({ name: 'new-name' })
        expect(result.success).toBe(true)
    })

    it('accepts partial update with only status', () => {
        const result = deviceUpdateSchema.safeParse({ status: 'failed' })
        expect(result.success).toBe(true)
    })

    it('rejects empty name string in update', () => {
        const result = deviceUpdateSchema.safeParse({ name: '' })
        expect(result.success).toBe(false)
    })

    it('rejects invalid status in update', () => {
        const result = deviceUpdateSchema.safeParse({ status: 'broken' })
        expect(result.success).toBe(false)
    })

    it('accepts reason field', () => {
        const result = deviceUpdateSchema.safeParse({ reason: 'Scheduled maintenance' })
        expect(result.success).toBe(true)
    })
})
