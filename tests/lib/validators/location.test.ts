import { describe, it, expect } from 'vitest'
import { locationCreateSchema, locationUpdateSchema } from '@/lib/validators/location'

describe('locationCreateSchema', () => {
    describe('valid data', () => {
        it('parses a minimal valid location', () => {
            const input = {
                name: 'Server Room A',
                slug: 'server-room-a',
                siteId: 'site-001',
            }
            const result = locationCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('parses a fully specified location', () => {
            const input = {
                name: 'Server Room A',
                slug: 'server-room-a',
                siteId: 'site-001',
                tenantId: 'tenant-001',
                description: 'Main server room on 2nd floor',
            }
            const result = locationCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('accepts null for optional nullable fields', () => {
            const input = {
                name: 'Room B',
                slug: 'room-b',
                siteId: 'site-001',
                tenantId: null,
                description: null,
            }
            const result = locationCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('accepts slug with numbers and hyphens', () => {
            const result = locationCreateSchema.safeParse({
                name: 'Room 101',
                slug: 'room-101',
                siteId: 'site-001',
            })
            expect(result.success).toBe(true)
        })

        it('accepts single-character slug', () => {
            const result = locationCreateSchema.safeParse({
                name: 'A',
                slug: 'a',
                siteId: 'site-001',
            })
            expect(result.success).toBe(true)
        })
    })

    describe('invalid data', () => {
        it('rejects empty name', () => {
            const result = locationCreateSchema.safeParse({
                name: '',
                slug: 'test',
                siteId: 'site-001',
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing name', () => {
            const result = locationCreateSchema.safeParse({
                slug: 'test',
                siteId: 'site-001',
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty slug', () => {
            const result = locationCreateSchema.safeParse({
                name: 'Room',
                slug: '',
                siteId: 'site-001',
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing slug', () => {
            const result = locationCreateSchema.safeParse({
                name: 'Room',
                siteId: 'site-001',
            })
            expect(result.success).toBe(false)
        })

        it('rejects slug with uppercase letters', () => {
            const result = locationCreateSchema.safeParse({
                name: 'Room',
                slug: 'Server-Room',
                siteId: 'site-001',
            })
            expect(result.success).toBe(false)
        })

        it('rejects slug with underscores', () => {
            const result = locationCreateSchema.safeParse({
                name: 'Room',
                slug: 'server_room',
                siteId: 'site-001',
            })
            expect(result.success).toBe(false)
        })

        it('rejects slug with spaces', () => {
            const result = locationCreateSchema.safeParse({
                name: 'Room',
                slug: 'server room',
                siteId: 'site-001',
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty siteId', () => {
            const result = locationCreateSchema.safeParse({
                name: 'Room',
                slug: 'room',
                siteId: '',
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing siteId', () => {
            const result = locationCreateSchema.safeParse({
                name: 'Room',
                slug: 'room',
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty object', () => {
            const result = locationCreateSchema.safeParse({})
            expect(result.success).toBe(false)
        })
    })
})

describe('locationUpdateSchema', () => {
    it('accepts empty object (all fields optional)', () => {
        const result = locationUpdateSchema.safeParse({})
        expect(result.success).toBe(true)
    })

    it('accepts partial update with only name', () => {
        const result = locationUpdateSchema.safeParse({ name: 'New Room Name' })
        expect(result.success).toBe(true)
    })

    it('accepts partial update with only slug', () => {
        const result = locationUpdateSchema.safeParse({ slug: 'new-slug' })
        expect(result.success).toBe(true)
    })

    it('rejects invalid slug in update', () => {
        const result = locationUpdateSchema.safeParse({ slug: 'INVALID' })
        expect(result.success).toBe(false)
    })

    it('rejects empty name in update', () => {
        const result = locationUpdateSchema.safeParse({ name: '' })
        expect(result.success).toBe(false)
    })
})
