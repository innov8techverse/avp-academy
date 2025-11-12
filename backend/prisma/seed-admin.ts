import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
/*
 * Minimal seed script to ensure exactly one admin user exists.
 * Usage:
 *  npm run prisma:seed:admin
 * Environment overrides (optional):
 *  ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_PHONE
 */

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'visv6812@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const fullName = process.env.ADMIN_NAME || 'Super Admin';
  const phone = process.env.ADMIN_PHONE || '+910000000000';

  console.log('🔐 Seeding / ensuring admin user:', email);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== 'ADMIN') {
      await prisma.user.update({
        where: { user_id: existing.user_id },
        data: { role: Role.ADMIN },
      });
      console.log('✅ Updated existing user to ADMIN role.');
    } else {
      console.log('✅ Admin user already exists. No changes made.');
    }
  } else {
    // Check if username 'admin' already exists
    const existingByUsername = await prisma.user.findUnique({ where: { username: 'admin' } });
    const username = existingByUsername ? `admin_${Date.now()}` : 'admin';
    
    const hashed = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: {
        email,
        username,
        password: hashed,
        full_name: fullName,
        phone_number: phone,
        role: Role.ADMIN,
        email_verified: true,
        phone_verified: true,
      },
    });
    console.log('✅ Created admin user with id:', created.user_id);
  }
}

main()
  .catch((e) => {
    console.error('❌ Admin seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
