import { Role } from '@prisma/client'

const PERMISSIONS: Record<Role, Record<string, boolean>> = {
  ADMIN: {
    canManageUsers: true,
    canEditContract: true,
    canDeleteTicket: true,
    canViewReports: true,
    canConfigJira: true,
  },
  PM: {
    canManageUsers: false,
    canEditContract: true,
    canDeleteTicket: false,
    canViewReports: true,
    canConfigJira: true,
  },
  STAFF: {
    canManageUsers: false,
    canEditContract: false,
    canDeleteTicket: false,
    canViewReports: false,
    canConfigJira: false,
  },
}

export function can(role: Role, action: string): boolean {
  return PERMISSIONS[role]?.[action] ?? false
}
