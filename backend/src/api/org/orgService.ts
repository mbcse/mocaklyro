import { PrismaClient, KlyroGate, KlyroGateVerification, VerificationStatus } from '@prisma/client';
import { Logger } from '@/common/utils/logger';

const prisma = new PrismaClient();

export interface CreateKlyroGateRequest {
  name: string;
  slug: string;
  description?: string;
  organizationId: string;
  isActive?: boolean;
  allowSelfVerify?: boolean;
  requiresApproval?: boolean;
  maxVerifications?: number;
  bannerUrl?: string;
  primaryColor?: string;
  customMessage?: string;
  expiresAt?: Date;
  // Post-verification actions
  actionType?: string;
  actionUrl?: string;
  actionMethod?: string;
  actionHeaders?: string;
  actionPayload?: string;
  successMessage?: string;
  credentialRequirements?: Array<{
    credentialType: string;
    programId: string;
    minValue?: number;
    maxValue?: number;
    stringValue?: string;
    isRequired?: boolean;
  }>;
}

export interface UpdateKlyroGateRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  allowSelfVerify?: boolean;
  requiresApproval?: boolean;
  maxVerifications?: number;
  bannerUrl?: string;
  primaryColor?: string;
  customMessage?: string;
  expiresAt?: Date;
  // Post-verification actions
  actionType?: string;
  actionUrl?: string;
  actionMethod?: string;
  actionHeaders?: string;
  actionPayload?: string;
  successMessage?: string;
}

export class OrgService {
  
  async verifyPartnerOwnsOrganization(partnerId: string, organizationId: string): Promise<boolean> {
    try {
      const organization = await prisma.organization.findFirst({
        where: {
          id: organizationId,
          partnerId: partnerId
        }
      });
      
      return !!organization;
    } catch (error) {
      Logger.error('OrgService', 'Error verifying partner organization ownership', { error });
      return false;
    }
  }
  
  async createKlyroGate(data: CreateKlyroGateRequest): Promise<KlyroGate> {
    try {
      Logger.info('OrgService', 'Creating KlyroGate', { slug: data.slug });
      
      // Check if slug already exists
      const existingGate = await prisma.klyroGate.findUnique({
        where: { slug: data.slug }
      });

      if (existingGate) {
        throw new Error(`KlyroGate with slug '${data.slug}' already exists`);
      }

      // Create the KlyroGate with credential requirements
      const klyroGate = await prisma.klyroGate.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          organizationId: data.organizationId,
          isActive: data.isActive ?? true,
          allowSelfVerify: data.allowSelfVerify ?? true,
          requiresApproval: data.requiresApproval ?? false,
          maxVerifications: data.maxVerifications,
          bannerUrl: data.bannerUrl,
          primaryColor: data.primaryColor ?? '#6366f1',
          customMessage: data.customMessage,
          expiresAt: data.expiresAt,
          // Action fields
          actionType: data.actionType,
          actionUrl: data.actionUrl,
          actionMethod: data.actionMethod ?? 'POST',
          actionHeaders: data.actionHeaders,
          actionPayload: data.actionPayload,
          successMessage: data.successMessage,
          credentialRequirements: {
            create: data.credentialRequirements?.map(req => ({
              credentialType: req.credentialType,
              programId: req.programId,
              minValue: req.minValue,
              maxValue: req.maxValue,
              stringValue: req.stringValue,
              isRequired: req.isRequired ?? true
            })) || []
          }
        },
        include: {
          credentialRequirements: true,
          organization: true
        }
      });

      Logger.info('OrgService', 'KlyroGate created successfully', { id: klyroGate.id });
      return klyroGate;
    } catch (error) {
      Logger.error('OrgService', 'Error creating KlyroGate', { error });
      throw error;
    }
  }

  async getKlyroGates(organizationId?: string): Promise<KlyroGate[]> {
    try {
      const gates = await prisma.klyroGate.findMany({
        where: organizationId ? { organizationId } : undefined,
        include: {
          credentialRequirements: true,
          organization: true,
          _count: {
            select: {
              verifications: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      Logger.info('OrgService', 'Fetched KlyroGates', { count: gates.length });
      return gates;
    } catch (error) {
      Logger.error('OrgService', 'Error fetching KlyroGates', { error });
      throw error;
    }
  }

  async getKlyroGatesForPartner(partnerId: string): Promise<KlyroGate[]> {
    try {
      const gates = await prisma.klyroGate.findMany({
        where: {
          organization: {
            partnerId: partnerId
          }
        },
        include: {
          credentialRequirements: true,
          organization: true,
          _count: {
            select: {
              verifications: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      Logger.info('OrgService', 'Fetched KlyroGates for partner', { partnerId, count: gates.length });
      return gates;
    } catch (error) {
      Logger.error('OrgService', 'Error fetching KlyroGates for partner', { error });
      throw error;
    }
  }

  async getKlyroGateBySlug(slug: string): Promise<KlyroGate | null> {
    try {
      const gate = await prisma.klyroGate.findUnique({
        where: { slug },
        include: {
          credentialRequirements: true,
          organization: true,
          _count: {
            select: {
              verifications: true
            }
          }
        }
      });

      Logger.info('OrgService', 'Fetched KlyroGate by slug', { slug, found: !!gate });
      return gate;
    } catch (error) {
      Logger.error('OrgService', 'Error fetching KlyroGate by slug', { error });
      throw error;
    }
  }

  async updateKlyroGate(id: string, data: UpdateKlyroGateRequest): Promise<KlyroGate> {
    try {
      const updatedGate = await prisma.klyroGate.update({
        where: { id },
        data,
        include: {
          credentialRequirements: true,
          organization: true
        }
      });

      Logger.info('OrgService', 'KlyroGate updated successfully', { id });
      return updatedGate;
    } catch (error) {
      Logger.error('OrgService', 'Error updating KlyroGate', { error });
      throw error;
    }
  }

  async deleteKlyroGate(id: string): Promise<void> {
    try {
      await prisma.klyroGate.delete({
        where: { id }
      });

      Logger.info('OrgService', 'KlyroGate deleted successfully', { id });
    } catch (error) {
      Logger.error('OrgService', 'Error deleting KlyroGate', { error });
      throw error;
    }
  }

  async verifyUserForGate(
    slug: string, 
    verificationData: {
      status: 'verified' | 'failed' | 'non-compliant' | 'not-found';
      verificationResult?: any;
      credentialData?: any;
      error?: string;
      userInfo?: any;
    }
  ): Promise<KlyroGateVerification | { message: string }> {
    try {
      Logger.info('OrgService', 'Processing verification for gate', { 
        slug, 
        status: verificationData.status,
        hasCredentialData: !!verificationData.credentialData 
      });
      
      // Get the gate with its requirements
      const gate = await prisma.klyroGate.findUnique({
        where: { slug },
        include: {
          credentialRequirements: true
        }
      });

      if (!gate) {
        throw new Error('KlyroGate not found');
      }

      if (!gate.isActive) {
        throw new Error('KlyroGate is not active');
      }

      if (gate.expiresAt && gate.expiresAt < new Date()) {
        throw new Error('KlyroGate has expired');
      }

      // Extract AIR user info and create proper user identification
      let airUserId = null;
      let airDid = null;
      let userEmail = null;
      let userName = 'Anonymous User';
      
      // Try to extract AIR user info first (priority over credential data)
      if (verificationData.userInfo) {
        Logger.info('OrgService', 'AIR user info received', { 
          userInfo: verificationData.userInfo 
        });
        
        // Handle the correct AIR user info structure: { user: { id, abstractAccountAddress, email } }
        const airUser = verificationData.userInfo.user || verificationData.userInfo;
        
        Logger.info('OrgService', 'Processing AIR user structure', {
          hasUserProperty: !!verificationData.userInfo.user,
          airUserKeys: Object.keys(airUser),
          airUserSample: {
            id: airUser.id,
            abstractAccountAddress: airUser.abstractAccountAddress,
            email: airUser.email
          }
        });
        
        // Extract AIR user details from correct structure
        airUserId = airUser.id || verificationData.userInfo.userId;
        airDid = airUser.abstractAccountAddress || verificationData.userInfo.did || verificationData.userInfo.globalId;
        userEmail = airUser.email || verificationData.userInfo.email;
        userName = airUser.name || verificationData.userInfo.name || airUser.email || userName;
        
        Logger.info('OrgService', 'Extracted AIR user data', {
          airUserId,
          airDid,
          userEmail,
          userName,
          extractedFrom: {
            airUserId_source: airUser.id ? 'airUser.id' : 'fallback',
            airDid_source: airUser.abstractAccountAddress ? 'airUser.abstractAccountAddress' : 'fallback',
            userEmail_source: airUser.email ? 'airUser.email' : 'fallback'
          }
        });
      }
      
      // Fallback to credential data if no AIR user info
      if (!airUserId && verificationData.credentialData) {
        Logger.info('OrgService', 'Falling back to credential data', { 
          credentialData: verificationData.credentialData 
        });
        
        const credentialSubject = verificationData.credentialData.credentialSubject;
        if (credentialSubject) {
          airUserId = credentialSubject.id || credentialSubject.githubUsername;
          userName = credentialSubject.name || credentialSubject.githubUsername || userName;
          userEmail = credentialSubject.email;
        }
      }
      
      // Generate fallback ID if still no user identification
      if (!airUserId) {
        airUserId = 'anonymous-user-' + Date.now();
        Logger.warn('OrgService', 'No user identification found, using fallback', { airUserId });
      }

      // Create or find user based on AIR user ID or DID
      let user;
      try {
        // Try to find existing user by AIR DID, AIR User ID, or email
        user = await prisma.user.findFirst({
          where: {
            OR: [
              ...(airDid ? [{ airDid }] : []),
              ...(airUserId ? [{ airUserId }] : []),
              ...(userEmail ? [{ email: userEmail }] : [])
            ]
          }
        });
        
        if (!user) {
          // Create new user with AIR information
          user = await prisma.user.create({
            data: {
              airDid: airDid || null,
              airUserId: airUserId || null,
              email: userEmail || `${airUserId}@air.klyro.dev`,
              // Keep githubId as null for AIR-only users
              githubId: null
            }
          });
          Logger.info('OrgService', 'Created new AIR user for verification', { 
            userId: user.id, 
            airUserId, 
            airDid,
            userEmail 
          });
        } else {
          // Update existing user with AIR info if missing
          const updateData: any = {};
          if (!user.airDid && airDid) updateData.airDid = airDid;
          if (!user.airUserId && airUserId) updateData.airUserId = airUserId;
          if (!user.email && userEmail) updateData.email = userEmail;
          
          if (Object.keys(updateData).length > 0) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: updateData
            });
            Logger.info('OrgService', 'Updated existing user with AIR info', { 
              userId: user.id, 
              updateData 
            });
          }
          
          Logger.info('OrgService', 'Found existing user for AIR verification', { 
            userId: user.id, 
            airUserId,
            airDid 
          });
        }
      } catch (userError) {
        Logger.error('OrgService', 'Error creating/finding user', { userError });
        // For non-compliant or failed verifications, we don't need a user
        if (verificationData.status !== 'verified') {
          return {
            message: `Verification ${verificationData.status}: ${verificationData.error || 'Unknown error'}`
          };
        }
        throw userError;
      }

      // Check if user already has a verification for this gate
      const existingVerification = await prisma.klyroGateVerification.findUnique({
        where: {
          klyroGateId_userId: {
            klyroGateId: gate.id,
            userId: user.id
          }
        }
      });

      if (existingVerification) {
        Logger.info('OrgService', 'User already has verification for this gate', { 
          userId: user.id, 
          gateId: gate.id 
        });
        return existingVerification;
      }

      // Determine verification status based on AIR verification result
      let status: VerificationStatus;
      let verifiedAt: Date | undefined;
      let rejectionReason: string | undefined;

      switch (verificationData.status) {
        case 'verified':
          status = gate.requiresApproval ? VerificationStatus.PENDING : VerificationStatus.VERIFIED;
          verifiedAt = gate.requiresApproval ? undefined : new Date();
          break;
        case 'failed':
          status = VerificationStatus.REJECTED;
          rejectionReason = verificationData.error || 'Credential verification failed';
          break;
        case 'non-compliant':
          status = VerificationStatus.REJECTED;
          rejectionReason = 'User credentials do not meet verification requirements';
          break;
        case 'not-found':
          status = VerificationStatus.REJECTED;
          rejectionReason = 'User credentials not found - profile creation required';
          break;
        default:
          status = VerificationStatus.PENDING;
      }

      // Create verification record
      const verification = await prisma.klyroGateVerification.create({
        data: {
          klyroGateId: gate.id,
          userId: user.id,
          status,
          verifiedAt,
          rejectionReason,
          credentialResults: verificationData.verificationResult || verificationData.credentialData || {}
        },
        include: {
          user: true,
          klyroGate: true
        }
      });

      Logger.info('OrgService', 'Verification record created', { 
        verificationId: verification.id,
        status,
        userId: user.id,
        gateId: gate.id
      });

      // Execute post-verification action if verification is successful
      if (verification.status === VerificationStatus.VERIFIED && gate.actionType && gate.actionType !== 'none') {
        await this.executePostVerificationAction(gate, verification);
      }

      return verification;
    } catch (error) {
      Logger.error('OrgService', 'Error processing verification for gate', { error, slug });
      throw error;
    }
  }

  private async executePostVerificationAction(gate: any, verification: any): Promise<void> {
    try {
      Logger.info('OrgService', 'Executing post-verification action', { 
        gateId: gate.id, 
        actionType: gate.actionType 
      });

      if (gate.actionType === 'api_call' && gate.actionUrl) {
        await this.executeApiCall(gate, verification);
      }
      // Note: Redirect actions are handled on the frontend
      
    } catch (error) {
      Logger.error('OrgService', 'Error executing post-verification action', { 
        error, 
        gateId: gate.id, 
        actionType: gate.actionType 
      });
      // Don't throw error to prevent verification from failing due to action failure
    }
  }

  private async executeApiCall(gate: any, verification: any): Promise<void> {
    try {
      const user = verification.user;
      const userScore = user.userScore?.totalScore || 0;
      const githubUsername = user.githubData?.userInfo?.login || user.githubId;

      // Parse headers
      let headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (gate.actionHeaders) {
        try {
          const customHeaders = JSON.parse(gate.actionHeaders);
          headers = { ...headers, ...customHeaders };
        } catch (parseError) {
          Logger.warn('OrgService', 'Failed to parse action headers', { parseError });
        }
      }

      // Parse and populate payload template
      let payload: any = {};
      
      if (gate.actionPayload) {
        try {
          let payloadTemplate = gate.actionPayload;
          
          // Replace template variables
          payloadTemplate = payloadTemplate
            .replace(/\{\{userId\}\}/g, user.id)
            .replace(/\{\{githubUsername\}\}/g, githubUsername)
            .replace(/\{\{developerScore\}\}/g, userScore.toString())
            .replace(/\{\{gateName\}\}/g, gate.name)
            .replace(/\{\{gateSlug\}\}/g, gate.slug)
            .replace(/\{\{verificationId\}\}/g, verification.id)
            .replace(/\{\{timestamp\}\}/g, new Date().toISOString());

          payload = JSON.parse(payloadTemplate);
        } catch (parseError) {
          Logger.warn('OrgService', 'Failed to parse action payload', { parseError });
          // Use default payload
          payload = {
            userId: user.id,
            githubUsername,
            developerScore: userScore,
            gateName: gate.name,
            gateSlug: gate.slug,
            verificationId: verification.id,
            timestamp: new Date().toISOString()
          };
        }
      } else {
        // Default payload
        payload = {
          userId: user.id,
          githubUsername,
          developerScore: userScore,
          gateName: gate.name,
          gateSlug: gate.slug,
          verificationId: verification.id,
          timestamp: new Date().toISOString()
        };
      }

      // Make API call
      const response = await fetch(gate.actionUrl, {
        method: gate.actionMethod || 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      Logger.info('OrgService', 'API call executed', {
        gateId: gate.id,
        url: gate.actionUrl,
        method: gate.actionMethod,
        status: response.status,
        success: response.ok
      });

      if (!response.ok) {
        Logger.warn('OrgService', 'API call returned non-200 status', {
          status: response.status,
          statusText: response.statusText
        });
      }

    } catch (error) {
      Logger.error('OrgService', 'Error making API call', { error });
      throw error;
    }
  }

  async getGateVerifications(slug: string): Promise<KlyroGateVerification[]> {
    try {
      const gate = await prisma.klyroGate.findUnique({
        where: { slug }
      });

      if (!gate) {
        throw new Error('KlyroGate not found');
      }

      const verifications = await prisma.klyroGateVerification.findMany({
        where: {
          klyroGateId: gate.id
        },
        include: {
          user: {
            include: {
              githubData: true,
              userScore: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      Logger.info('OrgService', 'Fetched gate verifications', { slug, count: verifications.length });
      return verifications;
    } catch (error) {
      Logger.error('OrgService', 'Error fetching gate verifications', { error });
      throw error;
    }
  }

  async getGateVerificationsById(gateId: string): Promise<KlyroGateVerification[]> {
    try {
      const gate = await prisma.klyroGate.findUnique({
        where: { id: gateId }
      });

      if (!gate) {
        throw new Error('KlyroGate not found');
      }

      const verifications = await prisma.klyroGateVerification.findMany({
        where: {
          klyroGateId: gateId
        },
        include: {
          user: {
            include: {
              githubData: true,
              userScore: true,
              wallets: true
            }
          },
          klyroGate: {
            include: {
              organization: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      Logger.info('OrgService', 'Fetched gate verifications by ID', { gateId, count: verifications.length });
      return verifications;
    } catch (error) {
      Logger.error('OrgService', 'Error fetching gate verifications by ID', { error });
      throw error;
    }
  }

  async updateVerificationStatus(
    id: string, 
    status: VerificationStatus, 
    rejectionReason?: string
  ): Promise<KlyroGateVerification> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (status === VerificationStatus.VERIFIED) {
        updateData.verifiedAt = new Date();
        updateData.rejectedAt = null;
        updateData.rejectionReason = null;
      } else if (status === VerificationStatus.REJECTED) {
        updateData.rejectedAt = new Date();
        updateData.rejectionReason = rejectionReason;
        updateData.verifiedAt = null;
      }

      const verification = await prisma.klyroGateVerification.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          klyroGate: true
        }
      });

      Logger.info('OrgService', 'Verification status updated', { id, status });
      return verification;
    } catch (error) {
      Logger.error('OrgService', 'Error updating verification status', { error });
      throw error;
    }
  }

  async getOrganizationGates(organizationId: string): Promise<KlyroGate[]> {
    try {
      const gates = await prisma.klyroGate.findMany({
        where: { organizationId },
        include: {
          credentialRequirements: true,
          _count: {
            select: {
              verifications: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      Logger.info('OrgService', 'Fetched organization gates', { organizationId, count: gates.length });
      return gates;
    } catch (error) {
      Logger.error('OrgService', 'Error fetching organization gates', { error });
      throw error;
    }
  }
} 