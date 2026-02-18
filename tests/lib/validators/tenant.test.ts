import { describe, it, expect } from 'vitest'
import { tenantCreateSchema, tenantUpdateSchema } from '@/lib/validators/tenant'

describe('tenantCreateSchema', () => {
    describe('valid data', () => {
        it('parses a minimal valid tenant', () => {
            const result = tenantCreateSchema.safeParse({
                name: 'ACME Corp',
                slug: 'acme-corp',
            })
            expect(result.success).toBe(true)
        })

        it('parses a fully specified valid tenant', () => {
            const result = tenantCreateSchema.safeParse({
                name: 'ACME Corp',
                slug: 'acme-corp',
                description: 'Primary tenant for ACME Corporation',
            })
            expect(result.success).toBe(true)
        })

        it('accepts slug with only lowercase letters', () => {
            const result = tenantCreateSchema.safeParse({
                name: 'Tenant',
                slug: 'tenant',
            })
            expect(result.success).toBe(true)
        })

        it('accepts slug with lowercase letters and hyphens', () => {
            const result = tenantCreateSchema.safeParse({
                name: 'My Company',
                slug: 'my-company',
            })
            expect(result.success).toBe(true)
        })

        it('accepts slug with lowercase letters and numbers', () => {
            const result = tenantCreateSchema.safeParse({
                name: 'Tenant 2',
                slug: 'tenant2',
            })
            expect(result.success).toBe(true)
        })

        it('accepts slug with letters, numbers and hyphens combined', () => {
            const result = tenantCreateSchema.safeParse({
                name: 'Tenant ABC 123',
                slug: 'tenant-abc-123',
            })
            expect(result.success).toBe(true)
        })

        it('accepts null description', () => {
            const result = tenantCreateSchema.safeParse({
                name: 'Tenant',
                slug: 'tenant',
                description: null,
            })
            expect(result.success).toBe(true)
        })
    })

    describe('invalid data - name', () => {
        it('rejects empty name', () => {
            const result = tenantCreateSchema.safeParse({
                name: '',
                slug: 'tenant',
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing name', () => {
            const result = tenantCreateSchema.safeParse({
                slug: 'tenant',
            })
            expect(result.success).toBe(false)
        })
    })

    describe('invalid data - slug', () => {
        it('rejects empty slug', () => {
            const result = tenantCreateSchema.safeParse({
                name: 'Tenant',
                slug: '',
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing slug', () => {
            const result = tenantCreateSchema.safeParse({
                name: 'Tenant',
            })
            expect(result.success).toBe(false)
        })

        it('rejects slug with uppercase letters', () => {
            const result = tenantCreateSchema.safeParse({
                name: 'Tenant',
                slug: 'Tenant',
            })
            expect(result.success).toBe(false)
        })

        it('rejects slug with spaces', () => {
            const result = tenantCreateSchema.safeParse({
                name: 'My Tenant',
                slug: 'my tenant',
            })
            expect(result.success).toBe(false)
        })

        it('rejects slug with underscores', () => {
            const result = tenantCreateSchema.safeParse({
                name: 'My Tenant',
                slug: 'my_tenant',
            })
            expect(result.success).toBe(false)
        })

        it('rejects slug with special characters', () => {
            const result = tenantCreateSchema.safeParse({
                name: 'Tenant!',
                slug: 'tenant!',
            })
            expect(result.success).toBe(false)
        })

        it('rejects slug with dots', () => {
            const result = tenantCreateSchema.safeParse({
                name: 'Tenant',
                slug: 'my.tenant',
            })
            expect(result.success).toBe(false)
        })
    })

    describe('invalid data - missing required fields', () => {
        it('rejects empty object', () => {
            const result = tenantCreateSchema.safeParse({})
            expect(result.success).toBe(false)
        })
    })
})

describe('tenantUpdateSchema', () => {
    it('accepts empty object (all fields optional)', () => {
        const result = tenantUpdateSchema.safeParse({})
        expect(result.success).toBe(true)
    })

    it('accepts partial update with only name', () => {
        const result = tenantUpdateSchema.safeParse({ name: 'New Name' })
        expect(result.success).toBe(true)
    })

    it('accepts partial update with only slug', () => {
        const result = tenantUpdateSchema.safeParse({ slug: 'new-slug' })
        expect(result.success).toBe(true)
    })

    it('accepts partial update with only description', () => {
        const result = tenantUpdateSchema.safeParse({ description: 'Updated description' })
        expect(result.success).toBe(true)
    })

    it('rejects empty name string in update', () => {
        const result = tenantUpdateSchema.safeParse({ name: '' })
        expect(result.success).toBe(false)
    })

    it('rejects invalid slug in update', () => {
        const result = tenantUpdateSchema.safeParse({ slug: 'INVALID_SLUG' })
        expect(result.success).toBe(false)
    })
})
