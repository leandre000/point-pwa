import { PrismaClient, VerificationLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding KIRAKA Kigali Demo Database...');

  // 1. Initial Categories
  const categories = [
    {
      slug: 'cleaning',
      nameEn: 'Cleaning & Housekeeping',
      nameRw: "Isuku n'isukura",
      nameFr: 'Nettoyage & Ménage',
      iconName: 'Sparkles',
      displayOrder: 1,
    },
    {
      slug: 'plumbing',
      nameEn: 'Plumbing & Pipe Repair',
      nameRw: "Ubwubatsi bw'amazi",
      nameFr: 'Plomberie & Tuyauterie',
      iconName: 'Wrench',
      displayOrder: 2,
    },
    {
      slug: 'electrical',
      nameEn: 'Electrical & Appliances',
      nameRw: 'Amashanyarazi',
      nameFr: 'Électricité & Électroménager',
      iconName: 'Zap',
      displayOrder: 3,
    },
    {
      slug: 'carpentry',
      nameEn: 'Carpentry & Furniture Repair',
      nameRw: "Ububaji n'ibikoresho",
      nameFr: 'Menuiserie & Meubles',
      iconName: 'Hammer',
      displayOrder: 4,
    },
    {
      slug: 'maintenance',
      nameEn: 'General Home Maintenance',
      nameRw: 'Gusana no kubungabunga',
      nameFr: 'Entretien général',
      iconName: 'Shield',
      displayOrder: 5,
    },
  ];

  for (const cat of categories) {
    await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  // 2. Initial Kigali Service Areas (Neighborhoods)
  const areas = [
    { name: 'Remera', city: 'Kigali', countryCode: 'RW' },
    { name: 'Kacyiru', city: 'Kigali', countryCode: 'RW' },
    { name: 'Kimihurura', city: 'Kigali', countryCode: 'RW' },
    { name: 'Nyamirambo', city: 'Kigali', countryCode: 'RW' },
    { name: 'Kiyovu', city: 'Kigali', countryCode: 'RW' },
    { name: 'Gikondo', city: 'Kigali', countryCode: 'RW' },
    { name: 'Gisozi', city: 'Kigali', countryCode: 'RW' },
    { name: 'Kibagabaga', city: 'Kigali', countryCode: 'RW' },
    { name: 'Kanombe', city: 'Kigali', countryCode: 'RW' },
  ];

  for (const area of areas) {
    const existing = await prisma.serviceArea.findFirst({
      where: { name: area.name, city: area.city },
    });
    if (!existing) {
      await prisma.serviceArea.create({ data: area });
    }
  }

  // 3. Demo Providers (clearly marked demo data)
  const demoProviders = [
    {
      phone: '+250788000001',
      name: 'Eric Mugisha (Demo)',
      businessName: 'Eric Carpentry & Repair',
      bio: 'Expert woodworker specializing in kitchen cabinets, table restoration, and door alignment.',
      neighborhood: 'Remera',
      ratingAverage: 485,
      ratingCount: 14,
      completedJobs: 16,
      verificationLevel: VerificationLevel.PHONE_VERIFIED,
    },
    {
      phone: '+250788000002',
      name: 'Aline Umutoni (Demo)',
      businessName: 'Aline Sparkle Cleaning',
      bio: 'Reliable residential and move-out deep cleaning across Gasabo district.',
      neighborhood: 'Kacyiru',
      ratingAverage: 490,
      ratingCount: 22,
      completedJobs: 25,
      verificationLevel: VerificationLevel.PHONE_VERIFIED,
    },
    {
      phone: '+250788000003',
      name: 'Patrick Niyonzima (Demo)',
      businessName: 'Patrick Express Plumbing',
      bio: 'Fast leak fixes, water heater installation, and sink unclogging in Kigali.',
      neighborhood: 'Kimihurura',
      ratingAverage: 475,
      ratingCount: 9,
      completedJobs: 11,
      verificationLevel: VerificationLevel.PHONE_VERIFIED,
    },
  ];

  for (const p of demoProviders) {
    let user = await prisma.user.findUnique({ where: { phone: p.phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: p.phone,
          phoneVerifiedAt: new Date(),
          customerProfile: {
            create: {
              displayName: p.name,
              neighborhood: p.neighborhood,
            },
          },
          providerProfile: {
            create: {
              businessName: p.businessName,
              bio: p.bio,
              ratingAverage: p.ratingAverage,
              ratingCount: p.ratingCount,
              completedJobs: p.completedJobs,
              verificationLevel: p.verificationLevel,
            },
          },
        },
      });
    }
  }

  console.log('KIRAKA Kigali seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

