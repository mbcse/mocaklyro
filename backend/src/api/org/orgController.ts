import { Request, Response } from 'express';
import { OrgService } from './orgService';
import { Logger } from '../../common/utils/logger.js';
import { getActiveCredentialRequirements } from '../../config/airPrograms.js';

export class OrgController {
  private orgService: OrgService;

  constructor() {
    this.orgService = new OrgService();
  }

  // Create a new KlyroGate
  async createKlyroGate(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = req.partnerId;
      if (!partnerId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Verify partner owns the organization
      const { organizationId } = req.body;
      const hasAccess = await this.orgService.verifyPartnerOwnsOrganization(partnerId, organizationId);
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: 'You do not have access to this organization'
        });
        return;
      }

      const klyroGate = await this.orgService.createKlyroGate(req.body);
      res.status(201).json({
        success: true,
        data: klyroGate
      });
    } catch (error) {
      Logger.error('OrgController', 'Error creating KlyroGate', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to create KlyroGate'
      });
    }
  }

  // Get all KlyroGates for partner's organizations
  async getKlyroGates(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = req.partnerId;
      if (!partnerId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const gates = await this.orgService.getKlyroGatesForPartner(partnerId);
      res.json({
        success: true,
        data: gates
      });
    } catch (error) {
      Logger.error('OrgController', 'Error fetching KlyroGates', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch KlyroGates'
      });
    }
  }

  // Get a specific KlyroGate by slug
  async getKlyroGateBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const gate = await this.orgService.getKlyroGateBySlug(slug);
      
      if (!gate) {
        res.status(404).json({
          success: false,
          error: 'KlyroGate not found'
        });
        return;
      }

      res.json({
        success: true,
        data: gate
      });
    } catch (error) {
      Logger.error('OrgController', 'Error fetching KlyroGate', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch KlyroGate'
      });
    }
  }

  // Update a KlyroGate
  async updateKlyroGate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updatedGate = await this.orgService.updateKlyroGate(id, req.body);
      res.json({
        success: true,
        data: updatedGate
      });
    } catch (error) {
      Logger.error('OrgController', 'Error updating KlyroGate', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to update KlyroGate'
      });
    }
  }

  // Delete a KlyroGate
  async deleteKlyroGate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.orgService.deleteKlyroGate(id);
      res.json({
        success: true,
        message: 'KlyroGate deleted successfully'
      });
    } catch (error) {
      Logger.error('OrgController', 'Error deleting KlyroGate', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to delete KlyroGate'
      });
    }
  }

  // Verify a user for a specific KlyroGate (handles AIR credential verification results)
  async verifyUserForGate(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const { status, verificationResult, credentialData, error: errorMessage, userInfo } = req.body;
      
      Logger.info('OrgController', 'Processing verification request', { 
        slug, 
        status, 
        hasVerificationResult: !!verificationResult,
        hasCredentialData: !!credentialData 
      });
      
      // Validate required fields
      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Verification status is required'
        });
        return;
      }

      const verificationData = {
        status,
        verificationResult,
        credentialData,
        error: errorMessage,
        userInfo
      };
      
      const result = await this.orgService.verifyUserForGate(slug, verificationData);
      
      Logger.info('OrgController', 'Verification processed successfully', { 
        slug, 
        status,
        resultType: typeof result 
      });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      Logger.error('OrgController', 'Error processing verification for gate', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to process verification for gate'
      });
    }
  }

  // Get all verifications for a KlyroGate
  async getGateVerifications(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const verifications = await this.orgService.getGateVerifications(slug);
      res.json({
        success: true,
        data: verifications
      });
    } catch (error) {
      Logger.error('OrgController', 'Error fetching gate verifications', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch verifications'
      });
    }
  }

  // Get verifications by gate ID (for dashboard)
  async getGateVerificationsById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const verifications = await this.orgService.getGateVerificationsById(id);
      res.json({
        success: true,
        data: verifications
      });
    } catch (error) {
      Logger.error('OrgController', 'Error fetching gate verifications by ID', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch verifications'
      });
    }
  }

  // Update verification status (approve/reject)
  async updateVerificationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;
      
      const verification = await this.orgService.updateVerificationStatus(id, status, rejectionReason);
      res.json({
        success: true,
        data: verification
      });
    } catch (error) {
      Logger.error('OrgController', 'Error updating verification status', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to update verification status'
      });
    }
  }

  // Get all KlyroGates for an organization
  async getOrganizationGates(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const gates = await this.orgService.getOrganizationGates(id);
      res.json({
        success: true,
        data: gates
      });
    } catch (error) {
      Logger.error('OrgController', 'Error fetching organization gates', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch organization gates'
      });
    }
  }

  async getCredentialRequirements(req: Request, res: Response): Promise<void> {
    Logger.info('OrgController', 'getCredentialRequirements called');
    try {
      const requirements = getActiveCredentialRequirements();
      
      res.status(200).json({
        success: true,
        data: requirements
      });
      
    } catch (error) {
      Logger.error('OrgController', 'Error in getCredentialRequirements', error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
} 