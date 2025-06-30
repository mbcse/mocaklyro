import prisma from '../../database/prisma/client';

export interface CreateOrganizationData {
  name: string;
  description?: string;
  website?: string;
  partnerId: string;
}

export class OrganizationRepository {
  constructor() {
    // Use the singleton prisma instance
  }

  async create(data: CreateOrganizationData) {
    return await prisma.organization.create({
      data
    });
  }

  async findById(id: string) {
    return await prisma.organization.findUnique({
      where: { id },
      include: {
        partner: true,
        klyroGates: true
      }
    });
  }

  async findByPartnerId(partnerId: string) {
    console.log(`Finding organizations for partner: ${partnerId}`);
    
    const organizations = await prisma.organization.findMany({
      where: { partnerId },
      include: {
        klyroGates: {
          include: {
            verifications: true,
            credentialRequirements: true
          }
        }
      }
    });
    
    console.log(`Found ${organizations.length} organizations for partner ${partnerId}`);
    organizations.forEach(org => {
      console.log(`  - ${org.name} has ${org.klyroGates.length} gates`);
    });
    
    return organizations;
  }

  async update(id: string, data: Partial<CreateOrganizationData>) {
    return await prisma.organization.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return await prisma.organization.delete({
      where: { id }
    });
  }
} 