import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PartnerService } from './partnerService';
import { Logger } from '../../common/utils/logger';

export class PartnerController {
  private partnerService: PartnerService;

  constructor() {
    this.partnerService = new PartnerService();
  }

  async signup(req: Request, res: Response) {
    try {
      const { email, password, organization } = req.body;

      // Validate required fields
      if (!email || !password || !organization?.name) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, and organization name are required'
        });
      }

      // Check if partner already exists
      const existingPartner = await this.partnerService.findByEmail(email);
      if (existingPartner) {
        return res.status(400).json({
          success: false,
          error: 'Partner with this email already exists'
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create partner and organization
      const result = await this.partnerService.createPartnerWithOrganization({
        email,
        passwordHash,
        organization
      });

      // Generate JWT token
      const token = this.generateToken(result.partner.id);

      // Get organizations to include in response (for immediate dashboard use)
      const organizations = await this.partnerService.getPartnerOrganizations(result.partner.id);

      Logger.info('PartnerController', `Partner signup successful: ${email}`, {
        partnerId: result.partner.id,
        organizationId: result.organization.id,
        organizationsCount: organizations.length
      });

      res.status(201).json({
        success: true,
        data: {
          partner: {
            id: result.partner.id,
            email: result.partner.email,
            firstName: result.partner.firstName,
            lastName: result.partner.lastName
          },
          organization: result.organization,
          organizations: organizations,
          token
        }
      });
    } catch (error: any) {
      Logger.error('PartnerController', 'Partner signup error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      // Find partner
      const partner = await this.partnerService.findByEmail(email);
      if (!partner) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, partner.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Update last login
      await this.partnerService.updateLastLogin(partner.id);

      // Get partner's organizations
      const organizations = await this.partnerService.getPartnerOrganizations(partner.id);

      // Generate JWT token
      const token = this.generateToken(partner.id);

      Logger.info('PartnerController', `Partner login successful: ${email}`, {
        partnerId: partner.id,
        organizationsCount: organizations.length
      });

      res.json({
        success: true,
        data: {
          partner: {
            id: partner.id,
            email: partner.email,
            firstName: partner.firstName,
            lastName: partner.lastName
          },
          organizations,
          token
        }
      });
    } catch (error: any) {
      Logger.error('PartnerController', 'Partner login error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const partnerId = req.partnerId; // From auth middleware

      if (!partnerId) {
        return res.status(401).json({
          success: false,
          error: 'Partner ID not found in request'
        });
      }

      const partner = await this.partnerService.findById(partnerId);
      if (!partner) {
        return res.status(404).json({
          success: false,
          error: 'Partner not found'
        });
      }

      const organizations = await this.partnerService.getPartnerOrganizations(partnerId);

      Logger.info('PartnerController', `Returning profile for partner ${partnerId}`, {
        organizationCount: organizations.length,
        organizations: organizations.map(org => ({
          id: org.id,
          name: org.name,
          gateCount: org.klyroGates?.length || 0
        }))
      });

      res.json({
        success: true,
        data: {
          partner: {
            id: partner.id,
            email: partner.email,
            firstName: partner.firstName,
            lastName: partner.lastName
          },
          organizations
        }
      });
    } catch (error: any) {
      Logger.error('PartnerController', 'Get partner profile error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  private generateToken(partnerId: string): string {
    return jwt.sign(
      { partnerId },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '30d' }
    );
  }
} 