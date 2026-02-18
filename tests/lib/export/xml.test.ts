import { describe, it, expect } from 'vitest'
import { buildXml, parseXml, DCIM_XML_VERSION } from '@/lib/export/xml'

describe('DCIM_XML_VERSION', () => {
    it('exports a version string', () => {
        expect(typeof DCIM_XML_VERSION).toBe('string')
        expect(DCIM_XML_VERSION.length).toBeGreaterThan(0)
    })

    it('equals "1.0"', () => {
        expect(DCIM_XML_VERSION).toBe('1.0')
    })
})

describe('buildXml', () => {
    it('returns a string', () => {
        const result = buildXml({}, 'dcim')
        expect(typeof result).toBe('string')
    })

    it('includes the XML declaration', () => {
        const result = buildXml({}, 'dcim')
        expect(result).toContain('<?xml')
    })

    it('includes the root element name', () => {
        const result = buildXml({}, 'dcim')
        expect(result).toContain('<dcim')
    })

    it('uses custom root name', () => {
        const result = buildXml({}, 'racks')
        expect(result).toContain('<racks')
    })

    it('includes the DCIM_XML_VERSION attribute in root element', () => {
        const result = buildXml({}, 'dcim')
        expect(result).toContain(DCIM_XML_VERSION)
    })

    it('includes exportedAt attribute', () => {
        const result = buildXml({}, 'dcim')
        expect(result).toContain('exportedAt')
    })

    it('includes data from the provided object', () => {
        const data = {
            item: {
                id: 'item-001',
                name: 'Test Item',
            },
        }
        const result = buildXml(data, 'dcim')
        expect(result).toContain('item-001')
        expect(result).toContain('Test Item')
    })

    it('handles empty data object', () => {
        expect(() => buildXml({}, 'dcim')).not.toThrow()
        const result = buildXml({}, 'dcim')
        expect(typeof result).toBe('string')
    })

    it('handles nested data structures', () => {
        const data = {
            racks: {
                rack: [
                    { id: 'rack-001', name: 'Rack A' },
                    { id: 'rack-002', name: 'Rack B' },
                ],
            },
        }
        const result = buildXml(data, 'export')
        expect(result).toContain('rack-001')
        expect(result).toContain('rack-002')
        expect(result).toContain('Rack A')
        expect(result).toContain('Rack B')
    })

    it('produces well-formed XML (parseable by parseXml)', () => {
        const data = { item: { name: 'Test' } }
        const xmlString = buildXml(data, 'root')
        expect(() => parseXml(xmlString)).not.toThrow()
    })

    it('exportedAt is a valid ISO 8601 date string', () => {
        const before = new Date()
        const result = buildXml({}, 'dcim')
        const after = new Date()

        // Extract exportedAt value from the XML
        const match = result.match(/exportedAt="([^"]+)"/)
        expect(match).not.toBeNull()

        const exportedAt = new Date(match![1])
        expect(exportedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
        expect(exportedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
})

describe('parseXml', () => {
    it('returns an object', () => {
        const xml = '<?xml version="1.0"?><root><item>value</item></root>'
        const result = parseXml(xml)
        expect(typeof result).toBe('object')
        expect(result).not.toBeNull()
    })

    it('parses a simple XML string', () => {
        const xml = '<?xml version="1.0"?><root><name>Test</name></root>'
        const result = parseXml(xml) as Record<string, unknown>
        expect(result).toHaveProperty('root')
    })

    it('round-trips data through buildXml and parseXml', () => {
        const data = {
            device: {
                name: 'web-server-01',
                status: 'active',
            },
        }
        const xmlString = buildXml(data, 'dcim')
        const parsed = parseXml(xmlString) as Record<string, unknown>

        expect(parsed).toHaveProperty('dcim')
        const dcim = parsed['dcim'] as Record<string, unknown>
        expect(dcim).toHaveProperty('device')
    })

    it('handles XML with attributes', () => {
        const xml = '<?xml version="1.0"?><root version="1.0"><item>value</item></root>'
        expect(() => parseXml(xml)).not.toThrow()
        const result = parseXml(xml)
        expect(result).toHaveProperty('root')
    })

    it('handles empty root element', () => {
        const xml = '<?xml version="1.0"?><root></root>'
        expect(() => parseXml(xml)).not.toThrow()
    })
})
