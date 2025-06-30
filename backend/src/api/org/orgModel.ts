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
  expiresAt?: string; // ISO date string
  // Post-verification actions
  actionType?: string;
  actionUrl?: string;
  actionMethod?: string;
  actionHeaders?: string;
  actionPayload?: string;
  successMessage?: string;
  credentialRequirements?: CredentialRequirement[];
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
  expiresAt?: string; // ISO date string
  // Post-verification actions
  actionType?: string;
  actionUrl?: string;
  actionMethod?: string;
  actionHeaders?: string;
  actionPayload?: string;
  successMessage?: string;
}

export interface CredentialRequirement {
  credentialType: string;
  minValue?: number;
  maxValue?: number;
  stringValue?: string;
  isRequired?: boolean;
}

export interface VerifyUserRequest {
  userId: string;
}

export interface UpdateVerificationStatusRequest {
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  rejectionReason?: string;
} 