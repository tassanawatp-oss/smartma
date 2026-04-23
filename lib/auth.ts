import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import type { Role } from '@prisma/client'
import { writeAudit, AUDIT_ACTION, AUDIT_RESOURCE } from './audit'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user || !user.active) return null
        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) return null
        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
      }
      return session
    },
  },
  events: {
    signIn: async ({ user }) => {
      writeAudit({
        userId: user.id,
        userEmail: user.email ?? '',
        action: AUDIT_ACTION.LOGIN,
        resource: AUDIT_RESOURCE.AUTH,
      })
    },
    signOut: async (message) => {
      const token = 'token' in message ? message.token : null
      writeAudit({
        userId: token?.id as string | undefined,
        userEmail: (token?.email as string) ?? '',
        action: AUDIT_ACTION.LOGOUT,
        resource: AUDIT_RESOURCE.AUTH,
      })
    },
  },
  pages: {
    signIn: '/login',
  },
})
