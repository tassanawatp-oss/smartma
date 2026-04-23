import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? 'postgresql://tassana@localhost:5432/smartma' })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hash = await bcrypt.hash('password123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartma.com' },
    update: {},
    create: { email: 'admin@smartma.com', name: 'Tassnawat P.', role: 'ADMIN', password: hash },
  })

  const pm = await prisma.user.upsert({
    where: { email: 'pm@smartma.com' },
    update: {},
    create: { email: 'pm@smartma.com', name: 'สมชาย ก.', role: 'PM', password: hash },
  })

  const staff = await prisma.user.upsert({
    where: { email: 'staff@smartma.com' },
    update: {},
    create: { email: 'staff@smartma.com', name: 'วิไล ส.', role: 'STAFF', password: hash },
  })

  const c1 = await prisma.contract.upsert({
    where: { id: 'seed-contract-1' },
    update: {},
    create: {
      id: 'seed-contract-1',
      name: 'กรมทางหลวง — บำรุงรักษาระบบ 2567',
      sector: 'GOV',
      serviceType: 'Software + Hardware',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      pmId: pm.id,
    },
  })

  const c2 = await prisma.contract.upsert({
    where: { id: 'seed-contract-2' },
    update: {},
    create: {
      id: 'seed-contract-2',
      name: 'ABC Corporation — IT Support 2024',
      sector: 'PRIVATE',
      serviceType: 'Software',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-02-28'),
      pmId: pm.id,
    },
  })

  const c3 = await prisma.contract.upsert({
    where: { id: 'seed-contract-3' },
    update: {},
    create: {
      id: 'seed-contract-3',
      name: 'โรงพยาบาลรัฐ — ระบบคอมพิวเตอร์',
      sector: 'GOV',
      serviceType: 'Hardware',
      startDate: new Date('2024-06-15'),
      endDate: new Date('2025-06-14'),
      pmId: admin.id,
    },
  })

  // Tickets for c1
  await prisma.ticket.createMany({
    data: [
      { contractId: c1.id, title: 'Server หลักดับกะทันหัน', type: 'HW', priority: 'P1', status: 'OPEN', assigneeId: staff.id, jiraKey: 'DH-001' },
      { contractId: c1.id, title: 'อัปเดต Software ระบบ', type: 'SW', priority: 'P2', status: 'IN_PROGRESS', assigneeId: staff.id },
      { contractId: c1.id, title: 'เปลี่ยน HDD เครื่องเสีย', type: 'HW', priority: 'P3', status: 'RESOLVED', assigneeId: staff.id },
      { contractId: c1.id, title: 'ตั้งค่า Network Firewall', type: 'SW', priority: 'P3', status: 'CLOSED', assigneeId: pm.id },
      { contractId: c1.id, title: 'ติดตั้ง Antivirus', type: 'SW', priority: 'P4', status: 'CLOSED' },
    ],
    skipDuplicates: true,
  })

  // Tickets for c2
  await prisma.ticket.createMany({
    data: [
      { contractId: c2.id, title: 'Email server ส่งไม่ออก', type: 'SW', priority: 'P1', status: 'OPEN', assigneeId: staff.id },
      { contractId: c2.id, title: 'Printer ชั้น 3 ใช้งานไม่ได้', type: 'HW', priority: 'P3', status: 'IN_PROGRESS' },
    ],
    skipDuplicates: true,
  })

  // Tickets for c3
  await prisma.ticket.createMany({
    data: [
      { contractId: c3.id, title: 'RAM เครื่องเสีย ward 2', type: 'HW', priority: 'P1', status: 'OPEN' },
      { contractId: c3.id, title: 'ระบบ Backup ล้มเหลว', type: 'SW', priority: 'P1', status: 'OPEN' },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Seed complete')
  console.log('👤 admin@smartma.com / password123')
  console.log('👤 pm@smartma.com / password123')
  console.log('👤 staff@smartma.com / password123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
