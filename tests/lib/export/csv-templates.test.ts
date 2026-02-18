import { describe, it, expect } from 'vitest'
import { getDeviceTemplate, getCableTemplate } from '@/lib/export/csv-templates'

describe('getDeviceTemplate', () => {
    it('returns a non-empty string', () => {
        const result = getDeviceTemplate()
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
    })

    it('contains the correct header row', () => {
        const result = getDeviceTemplate()
        const lines = result.split('\n')
        expect(lines[0]).toBe('name,deviceTypeId,rackId,status,position,serialNumber,assetTag,tenantId')
    })

    it('contains exactly two lines (header + example row)', () => {
        const result = getDeviceTemplate()
        const lines = result.split('\n')
        expect(lines).toHaveLength(2)
    })

    it('example row starts with a device name placeholder', () => {
        const result = getDeviceTemplate()
        const lines = result.split('\n')
        const exampleRow = lines[1]
        expect(exampleRow).toMatch(/^web-server-01,/)
    })

    it('header includes all required device CSV fields', () => {
        const result = getDeviceTemplate()
        const header = result.split('\n')[0]
        const fields = header.split(',')

        expect(fields).toContain('name')
        expect(fields).toContain('deviceTypeId')
        expect(fields).toContain('rackId')
        expect(fields).toContain('status')
        expect(fields).toContain('position')
        expect(fields).toContain('serialNumber')
        expect(fields).toContain('assetTag')
        expect(fields).toContain('tenantId')
    })

    it('example row has same number of columns as header', () => {
        const result = getDeviceTemplate()
        const lines = result.split('\n')
        const headerColumns = lines[0].split(',').length
        const exampleColumns = lines[1].split(',').length
        expect(exampleColumns).toBe(headerColumns)
    })

    it('example row contains a status value of "active"', () => {
        const result = getDeviceTemplate()
        const exampleRow = result.split('\n')[1]
        expect(exampleRow).toContain('active')
    })
})

describe('getCableTemplate', () => {
    it('returns a non-empty string', () => {
        const result = getCableTemplate()
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
    })

    it('contains the correct header row', () => {
        const result = getCableTemplate()
        const lines = result.split('\n')
        expect(lines[0]).toBe(
            'label,cableType,status,terminationAType,terminationAId,terminationBType,terminationBId,length,color,tenantId'
        )
    })

    it('contains exactly two lines (header + example row)', () => {
        const result = getCableTemplate()
        const lines = result.split('\n')
        expect(lines).toHaveLength(2)
    })

    it('example row starts with a cable label placeholder', () => {
        const result = getCableTemplate()
        const lines = result.split('\n')
        const exampleRow = lines[1]
        expect(exampleRow).toMatch(/^cable-001,/)
    })

    it('header includes all required cable CSV fields', () => {
        const result = getCableTemplate()
        const header = result.split('\n')[0]
        const fields = header.split(',')

        expect(fields).toContain('label')
        expect(fields).toContain('cableType')
        expect(fields).toContain('status')
        expect(fields).toContain('terminationAType')
        expect(fields).toContain('terminationAId')
        expect(fields).toContain('terminationBType')
        expect(fields).toContain('terminationBId')
        expect(fields).toContain('length')
        expect(fields).toContain('color')
        expect(fields).toContain('tenantId')
    })

    it('example row has same number of columns as header', () => {
        const result = getCableTemplate()
        const lines = result.split('\n')
        const headerColumns = lines[0].split(',').length
        const exampleColumns = lines[1].split(',').length
        expect(exampleColumns).toBe(headerColumns)
    })

    it('example row contains a cable type of "cat6a"', () => {
        const result = getCableTemplate()
        const exampleRow = result.split('\n')[1]
        expect(exampleRow).toContain('cat6a')
    })

    it('example row contains a status of "connected"', () => {
        const result = getCableTemplate()
        const exampleRow = result.split('\n')[1]
        expect(exampleRow).toContain('connected')
    })

    it('example row uses "interface" as termination type', () => {
        const result = getCableTemplate()
        const exampleRow = result.split('\n')[1]
        expect(exampleRow).toContain('interface')
    })
})
