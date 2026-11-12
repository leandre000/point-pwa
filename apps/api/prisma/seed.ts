import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding KIRAKA Clean Reference Data & Super Admin (v5)...');

  // 1. Five Core Service Categories with Phosphor icons, descriptions, and cover photos (Section 7)
  const categories = [
    {
      slug: 'cleaning',
      nameEn: 'Cleaning & Housekeeping',
      nameRw: "Isuku n'isukura",
      nameFr: 'Nettoyage & Ménage',
      description: 'Regular and deep cleaning for homes and offices',
      iconName: 'Broom',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=960&q=80',
      displayOrder: 1,
      isActive: true,
    },
    {
      slug: 'plumbing',
      nameEn: 'Plumbing & Pipe Repair',
      nameRw: "Ubwubatsi bw'amazi",
      nameFr: 'Plomberie & Tuyauterie',
      description: 'Pipe repairs, leak fixes, water heaters, and fixture installations',
      iconName: 'Wrench',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=960&q=80',
      displayOrder: 2,
      isActive: true,
    },
    {
      slug: 'electrical',
      nameEn: 'Electrical & Appliances',
      nameRw: 'Amashanyarazi',
      nameFr: 'Électricité & Électroménager',
      description: 'Wiring, circuit breakers, lighting, and home appliances repair',
      iconName: 'Lightning',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=960&q=80',
      displayOrder: 3,
      isActive: true,
    },
    {
      slug: 'carpentry',
      nameEn: 'Carpentry & Furniture Repair',
      nameRw: "Ububaji n'ibikoresho",
      nameFr: 'Menuiserie & Meubles',
      description: 'Custom woodworking, door fitting, and furniture repairs',
      iconName: 'Hammer',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=960&q=80',
      displayOrder: 4,
      isActive: true,
    },
    {
      slug: 'maintenance',
      nameEn: 'General Home Maintenance',
      nameRw: 'Gusana no kubungabunga',
      nameFr: 'Entretien général',
      description: 'Handyman repairs, wall painting, mountings, and property care',
      iconName: 'Toolbox',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=960&q=80',
      displayOrder: 5,
      isActive: true,
    },
  ];

  for (const cat of categories) {
    await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }
  console.log(`✓ Seeded ${categories.length} official service categories.`);

  // 2. Kigali Launch Neighborhoods (Centroids documented in docs/ASSETS.md from OSM)
  const areas = [
    { name: 'Remera', city: 'Kigali', countryCode: 'RW', isActive: true },
    { name: 'Kacyiru', city: 'Kigali', countryCode: 'RW', isActive: true },
    { name: 'Kimihurura', city: 'Kigali', countryCode: 'RW', isActive: true },
    { name: 'Nyamirambo', city: 'Kigali', countryCode: 'RW', isActive: true },
    { name: 'Kiyovu', city: 'Kigali', countryCode: 'RW', isActive: true },
    { name: 'Gikondo', city: 'Kigali', countryCode: 'RW', isActive: true },
    { name: 'Gisozi', city: 'Kigali', countryCode: 'RW', isActive: true },
    { name: 'Kibagabaga', city: 'Kigali', countryCode: 'RW', isActive: true },
    { name: 'Kanombe', city: 'Kigali', countryCode: 'RW', isActive: true },
    { name: 'Nyarutarama', city: 'Kigali', countryCode: 'RW', isActive: true },
    { name: 'Kicukiro', city: 'Kigali', countryCode: 'RW', isActive: true },
    { name: 'Kagugu', city: 'Kigali', countryCode: 'RW', isActive: true },
  ];

  for (const area of areas) {
    const existing = await prisma.serviceArea.findFirst({
      where: { name: area.name, city: area.city },
    });
    if (existing) {
      await prisma.serviceArea.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    } else {
      await prisma.serviceArea.create({ data: area });
    }
  }
  console.log(`✓ Seeded ${areas.length} Kigali launch neighborhoods.`);

  // 3. Single Super Admin (D-012, D-020, D-024)
  const adminEmail = (process.env.ADMIN_SEED_EMAIL || 'Iamshemaleandre@gmail.com').toLowerCase().trim();
  const seedPassword = process.env.ADMIN_SEED_PASSWORD || 'KirakaAdmin2026!';
  const passwordHash = await hash(seedPassword, {
    algorithm: 2, // Argon2id
    memoryCost: 19456,
    timeCost: 2,
  });

  // Purge any legacy customer User record with this email to enforce total separation (D-024)
  await prisma.user.deleteMany({
    where: { email: adminEmail },
  });

  const superAdmin = await prisma.adminAccount.upsert({
    where: { email: adminEmail },
    update: {
      fullName: 'Shema Andre (Super Admin)',
      role: 'SUPER_ADMIN',
      isActive: true,
      passwordHash,
    },
    create: {
      email: adminEmail,
      fullName: 'Shema Andre (Super Admin)',
      role: 'SUPER_ADMIN',
      isActive: true,
      passwordHash,
    },
  });

  console.log(`✓ Seeded dedicated Super Admin: ${superAdmin.email} [Role: ${superAdmin.role}]`);
  console.log('Zero mock data seeded. Marketplace starts in clean reference state.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
