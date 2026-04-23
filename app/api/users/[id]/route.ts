import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const user = await prisma.user.update({
    where: { id },
    data: {
      role: body.role,
      active: body.active,
    },
    select: { id: true, name: true, email: true, role: true, active: true },
  })
  return NextResponse.json(user)
}
