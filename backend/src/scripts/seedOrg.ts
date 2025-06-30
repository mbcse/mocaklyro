import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDefaultOrganization() {
  try {
    // Check if default organization already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { id: 'default-org' }
    });

    if (existingOrg) {
      console.log('Default organization already exists');
      return;
    }

    // Create default organization
    const defaultOrg = await prisma.organization.create({
      data: {
        id: 'default-org',
        name: 'Klyro Platform',
        description: 'Default organization for Klyro platform gates',
        website: 'https://klyro.dev',
        contactEmail: 'hello@klyro.dev'
      }
    });

    console.log('Default organization created:', defaultOrg);
  } catch (error) {
    console.error('Error creating default organization:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDefaultOrganization(); 