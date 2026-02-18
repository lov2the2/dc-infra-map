import { describe, it, expect } from 'vitest'
import {
    powerPanelCreateSchema,
    powerPanelUpdateSchema,
    powerFeedCreateSchema,
    powerFeedUpdateSchema,
    powerReadingSchema,
    powerReadingBatchSchema,
} from '@/lib/validators/power'

describe('powerPanelCreateSchema', () => {
    describe('valid data', () => {
        it('parses a minimal valid power panel', () => {
            const input = {
                name: 'Panel A',
                slug: 'panel-a',
                siteId: 'site-001',
                ratedCapacityKw: 100,
            }
            const result = powerPanelCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('parses a fully specified power panel', () => {
            const input = {
                name: 'Main Distribution Panel',
                slug: 'main-dist-panel',
                siteId: 'site-001',
                location: 'Building A, Floor 1',
                ratedCapacityKw: 250.5,
                voltageV: 480,
                phaseType: 'three' as const,
            }
            const result = powerPanelCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('accepts both phaseType values', () => {
            const phases = ['single', 'three'] as const
            for (const phaseType of phases) {
                const result = powerPanelCreateSchema.safeParse({
                    name: 'Panel',
                    slug: 'panel',
                    siteId: 'site-001',
                    ratedCapacityKw: 50,
                    phaseType,
                })
                expect(result.success, `phaseType "${phaseType}" should be valid`).toBe(true)
            }
        })

        it('accepts null for optional nullable fields', () => {
            const input = {
                name: 'Panel',
                slug: 'panel',
                siteId: 'site-001',
                ratedCapacityKw: 50,
                location: null,
            }
            const result = powerPanelCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('accepts decimal ratedCapacityKw', () => {
            const result = powerPanelCreateSchema.safeParse({
                name: 'Panel',
                slug: 'panel',
                siteId: 'site-001',
                ratedCapacityKw: 0.5,
            })
            expect(result.success).toBe(true)
        })
    })

    describe('invalid data', () => {
        it('rejects empty name', () => {
            const result = powerPanelCreateSchema.safeParse({
                name: '',
                slug: 'panel',
                siteId: 'site-001',
                ratedCapacityKw: 50,
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid slug format', () => {
            const result = powerPanelCreateSchema.safeParse({
                name: 'Panel',
                slug: 'Panel A',
                siteId: 'site-001',
                ratedCapacityKw: 50,
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty siteId', () => {
            const result = powerPanelCreateSchema.safeParse({
                name: 'Panel',
                slug: 'panel',
                siteId: '',
                ratedCapacityKw: 50,
            })
            expect(result.success).toBe(false)
        })

        it('rejects zero ratedCapacityKw', () => {
            const result = powerPanelCreateSchema.safeParse({
                name: 'Panel',
                slug: 'panel',
                siteId: 'site-001',
                ratedCapacityKw: 0,
            })
            expect(result.success).toBe(false)
        })

        it('rejects negative ratedCapacityKw', () => {
            const result = powerPanelCreateSchema.safeParse({
                name: 'Panel',
                slug: 'panel',
                siteId: 'site-001',
                ratedCapacityKw: -10,
            })
            expect(result.success).toBe(false)
        })

        it('rejects non-integer voltageV', () => {
            const result = powerPanelCreateSchema.safeParse({
                name: 'Panel',
                slug: 'panel',
                siteId: 'site-001',
                ratedCapacityKw: 50,
                voltageV: 220.5,
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid phaseType', () => {
            const result = powerPanelCreateSchema.safeParse({
                name: 'Panel',
                slug: 'panel',
                siteId: 'site-001',
                ratedCapacityKw: 50,
                phaseType: 'dual',
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing ratedCapacityKw', () => {
            const result = powerPanelCreateSchema.safeParse({
                name: 'Panel',
                slug: 'panel',
                siteId: 'site-001',
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty object', () => {
            const result = powerPanelCreateSchema.safeParse({})
            expect(result.success).toBe(false)
        })
    })
})

describe('powerPanelUpdateSchema', () => {
    it('accepts empty object (all fields optional)', () => {
        const result = powerPanelUpdateSchema.safeParse({})
        expect(result.success).toBe(true)
    })

    it('accepts partial update with only name', () => {
        const result = powerPanelUpdateSchema.safeParse({ name: 'Updated Panel' })
        expect(result.success).toBe(true)
    })

    it('rejects invalid slug in update', () => {
        const result = powerPanelUpdateSchema.safeParse({ slug: 'INVALID SLUG' })
        expect(result.success).toBe(false)
    })
})

describe('powerFeedCreateSchema', () => {
    describe('valid data', () => {
        it('parses a minimal valid power feed', () => {
            const input = {
                panelId: 'panel-001',
                name: 'Feed A',
                maxAmps: 30,
                ratedKw: 10,
            }
            const result = powerFeedCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('parses a fully specified power feed', () => {
            const input = {
                panelId: 'panel-001',
                rackId: 'rack-001',
                name: 'Primary Feed',
                feedType: 'primary' as const,
                maxAmps: 60,
                ratedKw: 20.5,
            }
            const result = powerFeedCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('accepts both feedType values', () => {
            const types = ['primary', 'redundant'] as const
            for (const feedType of types) {
                const result = powerFeedCreateSchema.safeParse({
                    panelId: 'panel-001',
                    name: 'Feed',
                    maxAmps: 30,
                    ratedKw: 10,
                    feedType,
                })
                expect(result.success, `feedType "${feedType}" should be valid`).toBe(true)
            }
        })

        it('accepts null rackId', () => {
            const result = powerFeedCreateSchema.safeParse({
                panelId: 'panel-001',
                rackId: null,
                name: 'Feed',
                maxAmps: 30,
                ratedKw: 10,
            })
            expect(result.success).toBe(true)
        })
    })

    describe('invalid data', () => {
        it('rejects empty panelId', () => {
            const result = powerFeedCreateSchema.safeParse({
                panelId: '',
                name: 'Feed',
                maxAmps: 30,
                ratedKw: 10,
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty name', () => {
            const result = powerFeedCreateSchema.safeParse({
                panelId: 'panel-001',
                name: '',
                maxAmps: 30,
                ratedKw: 10,
            })
            expect(result.success).toBe(false)
        })

        it('rejects zero maxAmps', () => {
            const result = powerFeedCreateSchema.safeParse({
                panelId: 'panel-001',
                name: 'Feed',
                maxAmps: 0,
                ratedKw: 10,
            })
            expect(result.success).toBe(false)
        })

        it('rejects negative ratedKw', () => {
            const result = powerFeedCreateSchema.safeParse({
                panelId: 'panel-001',
                name: 'Feed',
                maxAmps: 30,
                ratedKw: -5,
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid feedType', () => {
            const result = powerFeedCreateSchema.safeParse({
                panelId: 'panel-001',
                name: 'Feed',
                maxAmps: 30,
                ratedKw: 10,
                feedType: 'backup',
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty object', () => {
            const result = powerFeedCreateSchema.safeParse({})
            expect(result.success).toBe(false)
        })
    })
})

describe('powerFeedUpdateSchema', () => {
    it('accepts empty object (all fields optional)', () => {
        const result = powerFeedUpdateSchema.safeParse({})
        expect(result.success).toBe(true)
    })

    it('accepts partial update with only name', () => {
        const result = powerFeedUpdateSchema.safeParse({ name: 'Updated Feed' })
        expect(result.success).toBe(true)
    })

    it('rejects negative maxAmps in update', () => {
        const result = powerFeedUpdateSchema.safeParse({ maxAmps: -10 })
        expect(result.success).toBe(false)
    })
})

describe('powerReadingSchema', () => {
    describe('valid data', () => {
        it('parses a minimal valid power reading', () => {
            const input = {
                feedId: 'feed-001',
                voltageV: 220,
                currentA: 15.5,
                powerKw: 3.41,
            }
            const result = powerReadingSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('parses a fully specified power reading', () => {
            const input = {
                feedId: 'feed-001',
                voltageV: 480,
                currentA: 45.2,
                powerKw: 21.7,
                powerFactor: 0.98,
                energyKwh: 1250.5,
            }
            const result = powerReadingSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('accepts zero values for voltage, current, power', () => {
            const result = powerReadingSchema.safeParse({
                feedId: 'feed-001',
                voltageV: 0,
                currentA: 0,
                powerKw: 0,
            })
            expect(result.success).toBe(true)
        })

        it('accepts negative values (e.g., regenerative)', () => {
            const result = powerReadingSchema.safeParse({
                feedId: 'feed-001',
                voltageV: -12,
                currentA: -1.5,
                powerKw: -0.018,
            })
            expect(result.success).toBe(true)
        })
    })

    describe('invalid data', () => {
        it('rejects empty feedId', () => {
            const result = powerReadingSchema.safeParse({
                feedId: '',
                voltageV: 220,
                currentA: 15,
                powerKw: 3.3,
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing voltageV', () => {
            const result = powerReadingSchema.safeParse({
                feedId: 'feed-001',
                currentA: 15,
                powerKw: 3.3,
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing currentA', () => {
            const result = powerReadingSchema.safeParse({
                feedId: 'feed-001',
                voltageV: 220,
                powerKw: 3.3,
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing powerKw', () => {
            const result = powerReadingSchema.safeParse({
                feedId: 'feed-001',
                voltageV: 220,
                currentA: 15,
            })
            expect(result.success).toBe(false)
        })

        it('rejects non-number voltageV', () => {
            const result = powerReadingSchema.safeParse({
                feedId: 'feed-001',
                voltageV: 'abc',
                currentA: 15,
                powerKw: 3.3,
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty object', () => {
            const result = powerReadingSchema.safeParse({})
            expect(result.success).toBe(false)
        })
    })
})

describe('powerReadingBatchSchema', () => {
    it('accepts an array of valid readings', () => {
        const input = [
            { feedId: 'feed-001', voltageV: 220, currentA: 15, powerKw: 3.3 },
            { feedId: 'feed-002', voltageV: 480, currentA: 45, powerKw: 21.6 },
        ]
        const result = powerReadingBatchSchema.safeParse(input)
        expect(result.success).toBe(true)
    })

    it('accepts an empty array', () => {
        const result = powerReadingBatchSchema.safeParse([])
        expect(result.success).toBe(true)
    })

    it('rejects if any item is invalid', () => {
        const input = [
            { feedId: 'feed-001', voltageV: 220, currentA: 15, powerKw: 3.3 },
            { feedId: '', voltageV: 220, currentA: 15, powerKw: 3.3 },
        ]
        const result = powerReadingBatchSchema.safeParse(input)
        expect(result.success).toBe(false)
    })

    it('rejects non-array input', () => {
        const result = powerReadingBatchSchema.safeParse({ feedId: 'feed-001' })
        expect(result.success).toBe(false)
    })
})
