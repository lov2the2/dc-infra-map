import { describe, it, expect } from 'vitest'
import {
    interfaceCreateSchema,
    interfaceUpdateSchema,
    consolePortCreateSchema,
    consolePortUpdateSchema,
    rearPortCreateSchema,
    rearPortUpdateSchema,
    frontPortCreateSchema,
    frontPortUpdateSchema,
    cableCreateSchema,
    cableUpdateSchema,
} from '@/lib/validators/cable'

describe('interfaceCreateSchema', () => {
    describe('valid data', () => {
        it('parses a minimal valid interface', () => {
            const input = {
                deviceId: 'device-001',
                name: 'eth0',
                interfaceType: 'rj45-1g' as const,
            }
            const result = interfaceCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('parses a fully specified interface', () => {
            const input = {
                deviceId: 'device-001',
                name: 'eth0',
                interfaceType: 'sfp+-10g' as const,
                speed: 10000,
                macAddress: 'AA:BB:CC:DD:EE:FF',
                enabled: true,
                description: 'Uplink port',
                reason: 'New installation',
            }
            const result = interfaceCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('accepts all valid interfaceType values', () => {
            const types = [
                'rj45-1g', 'rj45-10g', 'sfp-1g', 'sfp+-10g', 'sfp28-25g',
                'qsfp+-40g', 'qsfp28-100g', 'console', 'power',
            ] as const
            for (const interfaceType of types) {
                const result = interfaceCreateSchema.safeParse({
                    deviceId: 'device-001',
                    name: 'port0',
                    interfaceType,
                })
                expect(result.success, `interfaceType "${interfaceType}" should be valid`).toBe(true)
            }
        })

        it('accepts null for optional nullable fields', () => {
            const input = {
                deviceId: 'device-001',
                name: 'eth0',
                interfaceType: 'rj45-1g' as const,
                speed: null,
                macAddress: null,
                description: null,
            }
            const result = interfaceCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })
    })

    describe('invalid data', () => {
        it('rejects empty deviceId', () => {
            const result = interfaceCreateSchema.safeParse({
                deviceId: '',
                name: 'eth0',
                interfaceType: 'rj45-1g',
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty name', () => {
            const result = interfaceCreateSchema.safeParse({
                deviceId: 'device-001',
                name: '',
                interfaceType: 'rj45-1g',
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid interfaceType', () => {
            const result = interfaceCreateSchema.safeParse({
                deviceId: 'device-001',
                name: 'eth0',
                interfaceType: 'usb',
            })
            expect(result.success).toBe(false)
        })

        it('rejects non-integer speed', () => {
            const result = interfaceCreateSchema.safeParse({
                deviceId: 'device-001',
                name: 'eth0',
                interfaceType: 'rj45-1g',
                speed: 1.5,
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty object', () => {
            const result = interfaceCreateSchema.safeParse({})
            expect(result.success).toBe(false)
        })
    })
})

describe('interfaceUpdateSchema', () => {
    it('accepts empty object (all fields optional)', () => {
        const result = interfaceUpdateSchema.safeParse({})
        expect(result.success).toBe(true)
    })

    it('accepts partial update with only name', () => {
        const result = interfaceUpdateSchema.safeParse({ name: 'eth1' })
        expect(result.success).toBe(true)
    })

    it('rejects invalid interfaceType in update', () => {
        const result = interfaceUpdateSchema.safeParse({ interfaceType: 'invalid' })
        expect(result.success).toBe(false)
    })
})

describe('consolePortCreateSchema', () => {
    describe('valid data', () => {
        it('parses a minimal valid console port', () => {
            const input = {
                deviceId: 'device-001',
                name: 'console0',
                portType: 'rj45' as const,
            }
            const result = consolePortCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('accepts all valid portType values', () => {
            const types = ['rj45', 'usb', 'serial'] as const
            for (const portType of types) {
                const result = consolePortCreateSchema.safeParse({
                    deviceId: 'device-001',
                    name: 'console0',
                    portType,
                })
                expect(result.success, `portType "${portType}" should be valid`).toBe(true)
            }
        })
    })

    describe('invalid data', () => {
        it('rejects invalid portType', () => {
            const result = consolePortCreateSchema.safeParse({
                deviceId: 'device-001',
                name: 'console0',
                portType: 'hdmi',
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing deviceId', () => {
            const result = consolePortCreateSchema.safeParse({
                name: 'console0',
                portType: 'rj45',
            })
            expect(result.success).toBe(false)
        })
    })
})

describe('consolePortUpdateSchema', () => {
    it('accepts empty object (all fields optional)', () => {
        const result = consolePortUpdateSchema.safeParse({})
        expect(result.success).toBe(true)
    })
})

describe('rearPortCreateSchema', () => {
    describe('valid data', () => {
        it('parses a minimal valid rear port', () => {
            const input = {
                deviceId: 'device-001',
                name: 'rear-0',
                portType: 'rear' as const,
            }
            const result = rearPortCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('accepts positions as positive integer', () => {
            const result = rearPortCreateSchema.safeParse({
                deviceId: 'device-001',
                name: 'rear-0',
                portType: 'rear',
                positions: 4,
            })
            expect(result.success).toBe(true)
        })
    })

    describe('invalid data', () => {
        it('rejects positions of 0', () => {
            const result = rearPortCreateSchema.safeParse({
                deviceId: 'device-001',
                name: 'rear-0',
                portType: 'rear',
                positions: 0,
            })
            expect(result.success).toBe(false)
        })

        it('rejects negative positions', () => {
            const result = rearPortCreateSchema.safeParse({
                deviceId: 'device-001',
                name: 'rear-0',
                portType: 'rear',
                positions: -1,
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid portType', () => {
            const result = rearPortCreateSchema.safeParse({
                deviceId: 'device-001',
                name: 'rear-0',
                portType: 'side',
            })
            expect(result.success).toBe(false)
        })
    })
})

describe('rearPortUpdateSchema', () => {
    it('accepts empty object (all fields optional)', () => {
        const result = rearPortUpdateSchema.safeParse({})
        expect(result.success).toBe(true)
    })
})

describe('frontPortCreateSchema', () => {
    describe('valid data', () => {
        it('parses a minimal valid front port', () => {
            const input = {
                deviceId: 'device-001',
                name: 'front-0',
                portType: 'front' as const,
                rearPortId: 'rearport-001',
            }
            const result = frontPortCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })
    })

    describe('invalid data', () => {
        it('rejects missing rearPortId', () => {
            const result = frontPortCreateSchema.safeParse({
                deviceId: 'device-001',
                name: 'front-0',
                portType: 'front',
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty rearPortId', () => {
            const result = frontPortCreateSchema.safeParse({
                deviceId: 'device-001',
                name: 'front-0',
                portType: 'front',
                rearPortId: '',
            })
            expect(result.success).toBe(false)
        })
    })
})

describe('frontPortUpdateSchema', () => {
    it('accepts empty object (all fields optional)', () => {
        const result = frontPortUpdateSchema.safeParse({})
        expect(result.success).toBe(true)
    })
})

describe('cableCreateSchema', () => {
    const validCable = {
        cableType: 'cat6a' as const,
        label: 'CAB-001',
        terminationAType: 'interface' as const,
        terminationAId: 'iface-001',
        terminationBType: 'interface' as const,
        terminationBId: 'iface-002',
    }

    describe('valid data', () => {
        it('parses a minimal valid cable', () => {
            const result = cableCreateSchema.safeParse(validCable)
            expect(result.success).toBe(true)
        })

        it('parses a fully specified cable', () => {
            const input = {
                ...validCable,
                status: 'connected' as const,
                length: '3m',
                color: 'blue',
                tenantId: 'tenant-001',
                description: 'Server uplink cable',
                reason: 'New installation',
            }
            const result = cableCreateSchema.safeParse(input)
            expect(result.success).toBe(true)
        })

        it('accepts all valid cableType values', () => {
            const types = [
                'cat5e', 'cat6', 'cat6a', 'fiber-om3', 'fiber-om4', 'fiber-sm',
                'dac', 'power', 'console',
            ] as const
            for (const cableType of types) {
                const result = cableCreateSchema.safeParse({ ...validCable, cableType })
                expect(result.success, `cableType "${cableType}" should be valid`).toBe(true)
            }
        })

        it('accepts all valid status values', () => {
            const statuses = ['connected', 'planned', 'decommissioned'] as const
            for (const status of statuses) {
                const result = cableCreateSchema.safeParse({ ...validCable, status })
                expect(result.success, `status "${status}" should be valid`).toBe(true)
            }
        })

        it('accepts all valid termination types', () => {
            const types = [
                'interface', 'frontPort', 'rearPort', 'consolePort', 'powerPort', 'powerOutlet',
            ] as const
            for (const t of types) {
                const result = cableCreateSchema.safeParse({
                    ...validCable,
                    terminationAType: t,
                    terminationBType: t,
                })
                expect(result.success, `terminationType "${t}" should be valid`).toBe(true)
            }
        })
    })

    describe('invalid data', () => {
        it('rejects invalid cableType', () => {
            const result = cableCreateSchema.safeParse({
                ...validCable,
                cableType: 'coax',
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid status', () => {
            const result = cableCreateSchema.safeParse({
                ...validCable,
                status: 'broken',
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty label', () => {
            const result = cableCreateSchema.safeParse({
                ...validCable,
                label: '',
            })
            expect(result.success).toBe(false)
        })

        it('rejects missing label', () => {
            const { label: _, ...noLabel } = validCable
            const result = cableCreateSchema.safeParse(noLabel)
            expect(result.success).toBe(false)
        })

        it('rejects empty terminationAId', () => {
            const result = cableCreateSchema.safeParse({
                ...validCable,
                terminationAId: '',
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty terminationBId', () => {
            const result = cableCreateSchema.safeParse({
                ...validCable,
                terminationBId: '',
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid terminationAType', () => {
            const result = cableCreateSchema.safeParse({
                ...validCable,
                terminationAType: 'usb',
            })
            expect(result.success).toBe(false)
        })

        it('rejects empty object', () => {
            const result = cableCreateSchema.safeParse({})
            expect(result.success).toBe(false)
        })
    })
})

describe('cableUpdateSchema', () => {
    it('accepts empty object (all fields optional)', () => {
        const result = cableUpdateSchema.safeParse({})
        expect(result.success).toBe(true)
    })

    it('accepts partial update with only label', () => {
        const result = cableUpdateSchema.safeParse({ label: 'CAB-002' })
        expect(result.success).toBe(true)
    })

    it('rejects invalid cableType in update', () => {
        const result = cableUpdateSchema.safeParse({ cableType: 'invalid' })
        expect(result.success).toBe(false)
    })

    it('accepts reason field', () => {
        const result = cableUpdateSchema.safeParse({ reason: 'Cable replacement' })
        expect(result.success).toBe(true)
    })
})
