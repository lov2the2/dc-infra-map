import { describe, it, expect } from 'vitest'
import {
    checkPermission,
    isAdmin,
    canWrite,
    canDelete,
    type Resource,
    type Action,
} from '@/lib/auth/rbac'

const ALL_RESOURCES: Resource[] = [
    'sites', 'racks', 'devices', 'cables', 'power_config', 'power_readings',
    'access_logs', 'reports', 'users', 'audit_logs', 'alert_rules',
    'alert_channels', 'alert_history',
]
const ALL_ACTIONS: Action[] = ['read', 'create', 'update', 'delete']

describe('checkPermission', () => {
    describe('admin role - full permissions', () => {
        it('admin can read sites', () => {
            expect(checkPermission('admin', 'sites', 'read')).toBe(true)
        })

        it('admin can create sites', () => {
            expect(checkPermission('admin', 'sites', 'create')).toBe(true)
        })

        it('admin can update sites', () => {
            expect(checkPermission('admin', 'sites', 'update')).toBe(true)
        })

        it('admin can delete sites', () => {
            expect(checkPermission('admin', 'sites', 'delete')).toBe(true)
        })

        it('admin can perform all actions on racks', () => {
            for (const action of ALL_ACTIONS) {
                expect(checkPermission('admin', 'racks', action), `admin racks ${action}`).toBe(true)
            }
        })

        it('admin can perform all actions on devices', () => {
            for (const action of ALL_ACTIONS) {
                expect(checkPermission('admin', 'devices', action), `admin devices ${action}`).toBe(true)
            }
        })

        it('admin can perform all actions on users', () => {
            for (const action of ALL_ACTIONS) {
                expect(checkPermission('admin', 'users', action), `admin users ${action}`).toBe(true)
            }
        })

        it('admin can manage alert rules', () => {
            for (const action of ALL_ACTIONS) {
                expect(checkPermission('admin', 'alert_rules', action), `admin alert_rules ${action}`).toBe(true)
            }
        })

        it('admin can manage alert channels', () => {
            for (const action of ALL_ACTIONS) {
                expect(checkPermission('admin', 'alert_channels', action), `admin alert_channels ${action}`).toBe(true)
            }
        })
    })

    describe('operator role - limited permissions', () => {
        it('operator can read sites', () => {
            expect(checkPermission('operator', 'sites', 'read')).toBe(true)
        })

        it('operator cannot create sites', () => {
            expect(checkPermission('operator', 'sites', 'create')).toBe(false)
        })

        it('operator cannot update sites', () => {
            expect(checkPermission('operator', 'sites', 'update')).toBe(false)
        })

        it('operator cannot delete sites', () => {
            expect(checkPermission('operator', 'sites', 'delete')).toBe(false)
        })

        it('operator can read, create, update, delete racks', () => {
            expect(checkPermission('operator', 'racks', 'read')).toBe(true)
            expect(checkPermission('operator', 'racks', 'create')).toBe(true)
            expect(checkPermission('operator', 'racks', 'update')).toBe(true)
            expect(checkPermission('operator', 'racks', 'delete')).toBe(true)
        })

        it('operator can read, create, update, delete devices', () => {
            expect(checkPermission('operator', 'devices', 'read')).toBe(true)
            expect(checkPermission('operator', 'devices', 'create')).toBe(true)
            expect(checkPermission('operator', 'devices', 'update')).toBe(true)
            expect(checkPermission('operator', 'devices', 'delete')).toBe(true)
        })

        it('operator can only read power_config', () => {
            expect(checkPermission('operator', 'power_config', 'read')).toBe(true)
            expect(checkPermission('operator', 'power_config', 'create')).toBe(false)
            expect(checkPermission('operator', 'power_config', 'update')).toBe(false)
            expect(checkPermission('operator', 'power_config', 'delete')).toBe(false)
        })

        it('operator cannot manage users', () => {
            for (const action of ALL_ACTIONS) {
                expect(checkPermission('operator', 'users', action), `operator users ${action}`).toBe(false)
            }
        })

        it('operator can read audit_logs but not modify them', () => {
            expect(checkPermission('operator', 'audit_logs', 'read')).toBe(true)
            expect(checkPermission('operator', 'audit_logs', 'create')).toBe(false)
            expect(checkPermission('operator', 'audit_logs', 'delete')).toBe(false)
        })

        it('operator can read/create/update alert_rules but not delete', () => {
            expect(checkPermission('operator', 'alert_rules', 'read')).toBe(true)
            expect(checkPermission('operator', 'alert_rules', 'create')).toBe(true)
            expect(checkPermission('operator', 'alert_rules', 'update')).toBe(true)
            expect(checkPermission('operator', 'alert_rules', 'delete')).toBe(false)
        })

        it('operator can only read alert_channels', () => {
            expect(checkPermission('operator', 'alert_channels', 'read')).toBe(true)
            expect(checkPermission('operator', 'alert_channels', 'create')).toBe(false)
            expect(checkPermission('operator', 'alert_channels', 'update')).toBe(false)
            expect(checkPermission('operator', 'alert_channels', 'delete')).toBe(false)
        })
    })

    describe('viewer role - read-only permissions', () => {
        it('viewer can read sites', () => {
            expect(checkPermission('viewer', 'sites', 'read')).toBe(true)
        })

        it('viewer cannot write to sites', () => {
            expect(checkPermission('viewer', 'sites', 'create')).toBe(false)
            expect(checkPermission('viewer', 'sites', 'update')).toBe(false)
            expect(checkPermission('viewer', 'sites', 'delete')).toBe(false)
        })

        it('viewer can read racks, devices, cables', () => {
            for (const resource of ['racks', 'devices', 'cables'] as Resource[]) {
                expect(checkPermission('viewer', resource, 'read'), `viewer ${resource} read`).toBe(true)
            }
        })

        it('viewer cannot write to racks, devices, cables', () => {
            for (const resource of ['racks', 'devices', 'cables'] as Resource[]) {
                for (const action of ['create', 'update', 'delete'] as Action[]) {
                    expect(checkPermission('viewer', resource, action), `viewer ${resource} ${action}`).toBe(false)
                }
            }
        })

        it('viewer cannot access users', () => {
            for (const action of ALL_ACTIONS) {
                expect(checkPermission('viewer', 'users', action), `viewer users ${action}`).toBe(false)
            }
        })

        it('viewer cannot access audit_logs', () => {
            for (const action of ALL_ACTIONS) {
                expect(checkPermission('viewer', 'audit_logs', action), `viewer audit_logs ${action}`).toBe(false)
            }
        })

        it('viewer can read alert_rules but not modify', () => {
            expect(checkPermission('viewer', 'alert_rules', 'read')).toBe(true)
            expect(checkPermission('viewer', 'alert_rules', 'create')).toBe(false)
            expect(checkPermission('viewer', 'alert_rules', 'delete')).toBe(false)
        })

        it('viewer cannot access alert_channels', () => {
            for (const action of ALL_ACTIONS) {
                expect(checkPermission('viewer', 'alert_channels', action), `viewer alert_channels ${action}`).toBe(false)
            }
        })

        it('viewer can read reports but cannot create', () => {
            expect(checkPermission('viewer', 'reports', 'read')).toBe(true)
            expect(checkPermission('viewer', 'reports', 'create')).toBe(true)
        })
    })

    describe('tenant_viewer role - restricted permissions', () => {
        it('tenant_viewer can read sites', () => {
            expect(checkPermission('tenant_viewer', 'sites', 'read')).toBe(true)
        })

        it('tenant_viewer can read racks and devices', () => {
            expect(checkPermission('tenant_viewer', 'racks', 'read')).toBe(true)
            expect(checkPermission('tenant_viewer', 'devices', 'read')).toBe(true)
        })

        it('tenant_viewer can read power_readings', () => {
            expect(checkPermission('tenant_viewer', 'power_readings', 'read')).toBe(true)
        })

        it('tenant_viewer cannot write to anything', () => {
            for (const resource of ALL_RESOURCES) {
                for (const action of ['create', 'update', 'delete'] as Action[]) {
                    expect(
                        checkPermission('tenant_viewer', resource, action),
                        `tenant_viewer ${resource} ${action}`
                    ).toBe(false)
                }
            }
        })

        it('tenant_viewer cannot access cables', () => {
            for (const action of ALL_ACTIONS) {
                expect(checkPermission('tenant_viewer', 'cables', action), `tenant_viewer cables ${action}`).toBe(false)
            }
        })

        it('tenant_viewer cannot access users', () => {
            for (const action of ALL_ACTIONS) {
                expect(checkPermission('tenant_viewer', 'users', action)).toBe(false)
            }
        })

        it('tenant_viewer cannot access audit_logs', () => {
            for (const action of ALL_ACTIONS) {
                expect(checkPermission('tenant_viewer', 'audit_logs', action)).toBe(false)
            }
        })

        it('tenant_viewer can read alert_rules and alert_history', () => {
            expect(checkPermission('tenant_viewer', 'alert_rules', 'read')).toBe(true)
            expect(checkPermission('tenant_viewer', 'alert_history', 'read')).toBe(true)
        })
    })

    describe('unknown/invalid roles', () => {
        it('returns false for unknown role', () => {
            expect(checkPermission('superuser', 'sites', 'read')).toBe(false)
        })

        it('returns false for empty string role', () => {
            expect(checkPermission('', 'sites', 'read')).toBe(false)
        })

        it('returns false for random string role', () => {
            expect(checkPermission('hacker', 'devices', 'delete')).toBe(false)
        })
    })
})

describe('isAdmin', () => {
    it('returns true for admin role', () => {
        expect(isAdmin('admin')).toBe(true)
    })

    it('returns false for operator role', () => {
        expect(isAdmin('operator')).toBe(false)
    })

    it('returns false for viewer role', () => {
        expect(isAdmin('viewer')).toBe(false)
    })

    it('returns false for tenant_viewer role', () => {
        expect(isAdmin('tenant_viewer')).toBe(false)
    })

    it('returns false for unknown role', () => {
        expect(isAdmin('superuser')).toBe(false)
    })

    it('returns false for empty string', () => {
        expect(isAdmin('')).toBe(false)
    })
})

describe('canWrite', () => {
    it('admin can write to all major resources', () => {
        const writableResources: Resource[] = ['sites', 'racks', 'devices', 'cables', 'users']
        for (const resource of writableResources) {
            expect(canWrite('admin', resource), `admin can write ${resource}`).toBe(true)
        }
    })

    it('operator can write to racks and devices', () => {
        expect(canWrite('operator', 'racks')).toBe(true)
        expect(canWrite('operator', 'devices')).toBe(true)
    })

    it('operator cannot write to sites', () => {
        expect(canWrite('operator', 'sites')).toBe(false)
    })

    it('viewer cannot write to sites', () => {
        expect(canWrite('viewer', 'sites')).toBe(false)
    })

    it('viewer cannot write to racks', () => {
        expect(canWrite('viewer', 'racks')).toBe(false)
    })

    it('tenant_viewer cannot write to any resource', () => {
        for (const resource of ALL_RESOURCES) {
            expect(canWrite('tenant_viewer', resource), `tenant_viewer cannot write ${resource}`).toBe(false)
        }
    })

    it('unknown role cannot write to any resource', () => {
        for (const resource of ALL_RESOURCES) {
            expect(canWrite('unknown', resource), `unknown role cannot write ${resource}`).toBe(false)
        }
    })

    it('operator can write to alert_rules (create or update)', () => {
        expect(canWrite('operator', 'alert_rules')).toBe(true)
    })

    it('viewer cannot write to alert_rules', () => {
        expect(canWrite('viewer', 'alert_rules')).toBe(false)
    })
})

describe('canDelete', () => {
    it('admin can delete from all major resources', () => {
        const deletableResources: Resource[] = ['sites', 'racks', 'devices', 'cables', 'users']
        for (const resource of deletableResources) {
            expect(canDelete('admin', resource), `admin can delete ${resource}`).toBe(true)
        }
    })

    it('operator can delete racks and devices', () => {
        expect(canDelete('operator', 'racks')).toBe(true)
        expect(canDelete('operator', 'devices')).toBe(true)
    })

    it('operator cannot delete sites', () => {
        expect(canDelete('operator', 'sites')).toBe(false)
    })

    it('operator cannot delete alert_rules', () => {
        expect(canDelete('operator', 'alert_rules')).toBe(false)
    })

    it('viewer cannot delete from any resource', () => {
        for (const resource of ALL_RESOURCES) {
            expect(canDelete('viewer', resource), `viewer cannot delete ${resource}`).toBe(false)
        }
    })

    it('tenant_viewer cannot delete from any resource', () => {
        for (const resource of ALL_RESOURCES) {
            expect(canDelete('tenant_viewer', resource), `tenant_viewer cannot delete ${resource}`).toBe(false)
        }
    })

    it('unknown role cannot delete from any resource', () => {
        for (const resource of ALL_RESOURCES) {
            expect(canDelete('unknown', resource), `unknown role cannot delete ${resource}`).toBe(false)
        }
    })

    it('admin can delete alert_channels', () => {
        expect(canDelete('admin', 'alert_channels')).toBe(true)
    })

    it('operator cannot delete alert_channels', () => {
        expect(canDelete('operator', 'alert_channels')).toBe(false)
    })
})
