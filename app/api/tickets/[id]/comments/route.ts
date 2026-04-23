import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const comment = await prisma.comment.create({
    data: {
      ticketId: id,
      authorId: session.user.id!,
      body: body.body,
    },
    include: { author: { select: { name: true } } },
  })
  return NextResponse.json(comment, { status: 201 })
}
