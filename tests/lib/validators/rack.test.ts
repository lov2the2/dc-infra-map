import { describe, it, expect } from 'vitest'
import { rackCreateSchema, rackUpdateSchema } from '@/lib/validators/rack'

describe('rackCreateSchema', () => {
    describe('valid data', () => {
        it('parses a minimal valid rack', () => {
            const input = {
                name: 'rack-a01',
                locationId: 'loc-001',
            }
            const result = rackCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('parses a fully specified valid rack', () => {
            const input = {
                name: 'rack-a01',
                locationId: 'loc-001',
                tenantId: 'tenant-001',
                type: 'server' as const,
                uHeight: 42,
                description: 'Primary server rack',
            }
            const result = rackCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('accepts all valid type values', () => {
            const types = ['server', 'network', 'power', 'mixed'] as const
            for (const type of types) {
                const result = rackCreateSchema.safeParse({
                    name: 'rack-001',
                    locationId: 'loc-001',
                    type,
                })
                expect(result.success, `type "${type}" should be valid`).toBe(true)
            }
        })

        it('accepts uHeight at minimum boundary (1)', () => {
            const result = rackCreateSchema.safeParse({
                name: 'rack-001',
                locationId: 'loc-001',
                uHeight: 1,
            })
            expect(result.success).toBe(true)
        })

        it('accepts uHeight at maximum boundary (60)', () => {
            const result = rackCreateSchema.safeParse({
                name: 'rack-001',
                locationId: 'loc-001',
                uHeight: 60,
            })
            expect(result.success).toBe(true)
        })

        it('accepts common uHeight values (42U, 48U)', () => {
            for (const uHeight of [42, 48]) {
                const result = rackCreateSchema.safeParse({
                    name: 'rack-001',
                    locationId: 'loc-001',
                    uHeight,
                })
                expect(result.success).toBe(true)
            }
        })

        it('accepts null tenantId', () => {
            const result = rackCreateSchema.safeParse({
                name: 'rack-001',
                locationId: 'loc-001',
                tenantId: null,
            })
            expect(result.success).toBe(true)
        })

        it('accepts null description', () => {
            const result = rackCreateSchema.safeParse({
                name: 'rack-001',
                locationId: 'loc-001',
                description: null,
            })
            expect(result.success).toBe(true)
        })
    })

    describe('invalid data', () => {
        it('rejects empty name', () => {
            const result = rackCreateSchema.safeParse({
                name: '',
                locationId: 'loc-001',
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing name', () => {
            const result = rackCreateSchema.safeParse({
                locationId: 'loc-001',
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty locationId', () => {
            const result = rackCreateSchema.safeParse({
                name: 'rack-001',
                locationId: '',
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing locationId', () => {
            const result = rackCreateSchema.safeParse({
                name: 'rack-001',
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid type value', () => {
            const result = rackCreateSchema.safeParse({
                name: 'rack-001',
                locationId: 'loc-001',
                type: 'storage',
            })
            expect(result.success).toBe(false)
        })

        it('rejects uHeight of 0 (must be >= 1)', () => {
            const result = rackCreateSchema.safeParse({
                name: 'rack-001',
                locationId: 'loc-001',
                uHeight: 0,
            })
            expect(result.success).toBe(false)
        })

        it('rejects uHeight exceeding maximum (61)', () => {
            const result = rackCreateSchema.safeParse({
                name: 'rack-001',
                locationId: 'loc-001',
                uHeight: 61,
            })
            expect(result.success).toBe(false)
        })

        it('rejects non-integer uHeight', () => {
            const result = rackCreateSchema.safeParse({
                name: 'rack-001',
                locationId: 'loc-001',
                uHeight: 42.5,
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty object', () => {
            const result = rackCreateSchema.safeParse({})
            expect(result.success).toBe(false)
        })
    })
})

describe('rackUpdateSchema', () => {
    it('accepts empty object (all fields optional)', () => {
        const result = rackUpdateSchema.safeParse({})
        expect(result.success).toBe(true)
    })

    it('accepts partial update with only name', () => {
        const result = rackUpdateSchema.safeParse({ name: 'new-rack-name' })
        expect(result.success).toBe(true)
    })

    it('accepts partial update with only uHeight', () => {
        const result = rackUpdateSchema.safeParse({ uHeight: 48 })
        expect(result.success).toBe(true)
    })

    it('accepts partial update with only type', () => {
        const result = rackUpdateSchema.safeParse({ type: 'network' })
        expect(result.success).toBe(true)
    })

    it('rejects empty name string in update', () => {
        const result = rackUpdateSchema.safeParse({ name: '' })
        expect(result.success).toBe(false)
    })

    it('rejects invalid type in update', () => {
        const result = rackUpdateSchema.safeParse({ type: 'invalid' })
        expect(result.success).toBe(false)
    })

    it('rejects out-of-range uHeight in update', () => {
        const result = rackUpdateSchema.safeParse({ uHeight: 100 })
        expect(result.success).toBe(false)
    })
})
