import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

export interface AuditInput {
  userId?: string
  userEmail?: string
  action: string
  resource: string
  resourceId?: string
  meta?: Prisma.InputJsonValue
}

// Action constants
export const AUDIT_ACTION = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  CREATE_CONTRACT: 'CREATE_CONTRACT',
  UPDATE_CONTRACT: 'UPDATE_CONTRACT',
  DELETE_CONTRACT: 'DELETE_CONTRACT',
  CREATE_TICKET: 'CREATE_TICKET',
  UPDATE_TICKET: 'UPDATE_TICKET',
  CONFIG_JIRA: 'CONFIG_JIRA',
  JIRA_SYNC: 'JIRA_SYNC',
  CLEAR_SYNC_LOG: 'CLEAR_SYNC_LOG',
} as const

// Resource constants
export const AUDIT_RESOURCE = {
  AUTH: 'AUTH',
  USER: 'USER',
  CONTRACT: 'CONTRACT',
  TICKET: 'TICKET',
  JIRA_CONFIG: 'JIRA_CONFIG',
  SYSTEM: 'SYSTEM',
} as const

/**
 * Write an audit log entry — fire-and-forget, never throws.
 */
export function writeAudit(input: AuditInput): void {
  prisma.auditLog
    .create({
      data: {
        userId: input.userId ?? null,
        userEmail: input.userEmail ?? '',
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? null,
        meta: input.meta ?? undefined,
      },
    })
    .catch(() => {})
}
