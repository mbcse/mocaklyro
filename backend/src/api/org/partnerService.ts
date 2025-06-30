import { PartnerRepository } from './partnerRepository';
import { OrganizationRepository } from './organizationRepository';
import { Logger } from '../../common/utils/logger';

export interface CreatePartnerData {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  organization: {
    name: string;
    description?: string;
    website?: string;
  };
}

export class PartnerService {
  private partnerRepository: PartnerRepository;
  private organizationRepository: OrganizationRepository;

  constructor() {
    this.partnerRepository = new PartnerRepository();
    this.organizationRepository = new OrganizationRepository();
  }

  async findByEmail(email: string) {
    try {
      return await this.partnerRepository.findByEmail(email);
    } catch (error) {
      Logger.error('PartnerService', 'Error finding partner by email', error);
      throw error;
    }
  }

  async findById(id: string) {
    try {
      return await this.partnerRepository.findById(id);
    } catch (error) {
      Logger.error('PartnerService', 'Error finding partner by id', error);
      throw error;
    }
  }

  async createPartnerWithOrganization(data: CreatePartnerData) {
    try {
      // Create partner first
      const partner = await this.partnerRepository.create({
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName
      });

      // Create organization linked to partner
      const organization = await this.organizationRepository.create({
        name: data.organization.name,
        description: data.organization.description,
        website: data.organization.website,
        partnerId: partner.id
      });

      Logger.info('PartnerService', `Created partner and organization: ${data.email} -> ${data.organization.name}`);

      return { partner, organization };
    } catch (error) {
      Logger.error('PartnerService', 'Error creating partner with organization', error);
      throw error;
    }
  }

  async updateLastLogin(partnerId: string) {
    try {
      return await this.partnerRepository.updateLastLogin(partnerId);
    } catch (error) {
      Logger.error('PartnerService', 'Error updating last login', error);
      throw error;
    }
  }

  async getPartnerOrganizations(partnerId: string) {
    try {
      const organizations = await this.organizationRepository.findByPartnerId(partnerId);
      Logger.info('PartnerService', `Fetched ${organizations.length} organizations for partner ${partnerId}`);
      return organizations;
    } catch (error) {
      Logger.error('PartnerService', 'Error getting partner organizations', error);
      throw error;
    }
  }
} 