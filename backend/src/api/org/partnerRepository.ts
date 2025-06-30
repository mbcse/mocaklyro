import prisma from '../../database/prisma/client';

export interface CreatePartnerData {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
}

export class PartnerRepository {
  constructor() {
    // Use the singleton prisma instance
  }

  async create(data: CreatePartnerData) {
    return await prisma.partner.create({
      data
    });
  }

  async findByEmail(email: string) {
    return await prisma.partner.findUnique({
      where: { email },
      include: {
        organizations: true
      }
    });
  }

  async findById(id: string) {
    return await prisma.partner.findUnique({
      where: { id },
      include: {
        organizations: true
      }
    });
  }

  async updateLastLogin(id: string) {
    return await prisma.partner.update({
      where: { id },
      data: {
        lastLoginAt: new Date()
      }
    });
  }
} 