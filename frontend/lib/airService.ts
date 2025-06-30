import { AirService, BUILD_ENV, type AirEventListener } from "@mocanetwork/airkit";
import { AirCredentialWidget, type ClaimRequest, type QueryRequest, type JsonDocumentObject, type Language } from "@mocanetwork/air-credential-sdk";

// Environment configuration - using SANDBOX only as requested
const BUILD_ENVIRONMENT = BUILD_ENV.SANDBOX;
const PARTNER_ID = process.env.NEXT_PUBLIC_AIR_PARTNER_ID || '';

const ENVIRONMENT_CONFIG = {
  widgetUrl: "https://credential-widget.sandbox.air3.com",
  apiUrl: "https://credential.api.sandbox.air3.com",
};

// AIR credentials from environment
const ISSUER_DID = process.env.NEXT_PUBLIC_AIR_ISSUER_DID || '';
const ISSUER_API_KEY = process.env.NEXT_PUBLIC_AIR_ISSUER_API_KEY || '';
const VERIFIER_DID = process.env.NEXT_PUBLIC_AIR_VERIFIER_DID || '';
const VERIFIER_API_KEY = process.env.NEXT_PUBLIC_AIR_VERIFIER_API_KEY || '';
const CREDENTIAL_ID = process.env.NEXT_PUBLIC_AIR_CREDENTIAL_ID || '';
const PROGRAM_ID = process.env.NEXT_PUBLIC_AIR_PROGRAM_ID || '';

class KlyroAirService {
  private airService: AirService | null = null;
  private isInitialized = false;
  private isLoggedIn = false;

  async initialize(): Promise<void> {
    if (!PARTNER_ID) {
      throw new Error('AIR_PARTNER_ID not configured');
    }

    try {
      console.log('🚀 Initializing AIR service with SANDBOX environment');
      
      if (!this.airService) {
        this.airService = new AirService({ 
          partnerId: PARTNER_ID,
          modalZIndex: 99999 
        });

        await this.airService.init({ 
          buildEnv: BUILD_ENVIRONMENT, 
          enableLogging: true, 
          skipRehydration: false 
        });
        this.isInitialized = true;
      }

      if (!this.isLoggedIn) {
        console.log('🔑 Logging into AIR service...');
        const loginResult = await this.airService.login();
        console.log('✅ AIR service login successful:', loginResult);
        this.isLoggedIn = true;
      }
      
      console.log('✅ AIR service fully initialized and logged in');
    } catch (error) {
      console.error('❌ Failed to initialize/login AIR service:', error);
      throw error;
    }
  }

  async getPartnerUrl(): Promise<string> {
    if (!this.airService) {
      throw new Error('AIR service not initialized');
    }

    if (!this.isLoggedIn) {
      throw new Error('AIR service not logged in');
    }

    const result = await this.airService.goToPartner(ENVIRONMENT_CONFIG.widgetUrl);
    if (!result?.urlWithToken) {
      throw new Error('Failed to get partner URL with token');
    }

    return result.urlWithToken;
  }

  // Check if service is logged in
  getLoginStatus(): boolean {
    console.log('🔍 Checking AIR login status:', {
      isInitialized: this.isInitialized,
      isLoggedIn: this.isLoggedIn,
      airServiceExists: !!this.airService,
      airServiceLoggedIn: this.airService?.isLoggedIn
    });
    return this.isLoggedIn && this.airService?.isLoggedIn === true;
  }

  // Get user information from AIR
  async getUserInfo(): Promise<any> {
    if (!this.airService) {
      throw new Error('AIR service not initialized');
    }

    if (!this.isLoggedIn) {
      throw new Error('User not logged in');
    }

    try {
      const userInfo = await this.airService.getUserInfo();
      console.log('🔍 AIR User Info:', userInfo);
      return userInfo;
    } catch (error) {
      console.error('❌ Failed to get user info:', error);
      throw error;
    }
  }

  // Get access token for API calls
  async getAccessToken(): Promise<string> {
    if (!this.airService) {
      throw new Error('AIR service not initialized');
    }

    if (!this.isLoggedIn) {
      throw new Error('User not logged in');
    }

    try {
      const tokenResponse = await this.airService.getAccessToken();
      return tokenResponse.token;
    } catch (error) {
      console.error('❌ Failed to get access token:', error);
      throw error;
    }
  }

  // Get wallet provider for web3 interactions
  async getWalletProvider(): Promise<any> {
    if (!this.airService) {
      throw new Error('AIR service not initialized');
    }

    if (!this.isLoggedIn) {
      throw new Error('User not logged in');
    }

    try {
      console.log('🔗 Getting wallet provider...');
      const provider = await this.airService.getProvider();
      console.log('✅ Wallet provider ready:', !!provider);
      return provider;
    } catch (error) {
      console.error('❌ Failed to get wallet provider:', error);
      throw error;
    }
  }

  // Preload wallet in background
  async preloadWallet(): Promise<void> {
    if (!this.airService) {
      throw new Error('AIR service not initialized');
    }

    if (!this.isLoggedIn) {
      throw new Error('User not logged in');
    }

    try {
      console.log('⚡ Preloading wallet...');
      await this.airService.preloadWallet();
      console.log('✅ Wallet preloaded');
    } catch (error) {
      console.error('❌ Failed to preload wallet:', error);
      throw error;
    }
  }

  // Check if smart account is deployed
  async isSmartAccountDeployed(): Promise<boolean> {
    if (!this.airService) {
      throw new Error('AIR service not initialized');
    }

    if (!this.isLoggedIn) {
      throw new Error('User not logged in');
    }

    try {
      const isDeployed = await this.airService.isSmartAccountDeployed();
      console.log('🏗️ Smart account deployed:', isDeployed);
      return isDeployed;
    } catch (error) {
      console.error('❌ Failed to check smart account status:', error);
      throw error;
    }
  }

  // Deploy smart account
  async deploySmartAccount(): Promise<void> {
    if (!this.airService) {
      throw new Error('AIR service not initialized');
    }

    if (!this.isLoggedIn) {
      throw new Error('User not logged in');
    }

    try {
      console.log('🚀 Deploying smart account...');
      await this.airService.deploySmartAccount();
      console.log('✅ Smart account deployed');
    } catch (error) {
      console.error('❌ Failed to deploy smart account:', error);
      throw error;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      console.log('🚪 Logging out user...');
      
      if (this.airService) {
        await this.airService.logout();
      }
      
      // Reset all state
      this.isLoggedIn = false;
      this.isInitialized = false;
      this.airService = null;
      
      console.log('✅ User logged out successfully and state reset');
    } catch (error) {
      console.error('❌ Failed to logout:', error);
      // Still reset state even if logout fails
      this.isLoggedIn = false;
      this.isInitialized = false;
      this.airService = null;
      throw error;
    }
  }

  // Force refresh state - useful after logout/login
  async refreshState(): Promise<{ isLoggedIn: boolean; userInfo: any | null }> {
    try {
      const hasSession = await this.checkExistingSession();
      let userInfo = null;
      
      if (hasSession && this.getLoginStatus()) {
        try {
          userInfo = await this.getUserInfo();
        } catch (error) {
          console.warn('Could not get user info during refresh:', error);
        }
      }
      
      return {
        isLoggedIn: hasSession && this.getLoginStatus(),
        userInfo
      };
    } catch (error) {
      console.error('❌ Error refreshing state:', error);
      return {
        isLoggedIn: false,
        userInfo: null
      };
    }
  }

  // Subscribe to AIR service events (will implement with correct signature later)
  // onAirEvent(event: string, callback: (data?: any) => void): void {
  //   if (!this.airService) {
  //     throw new Error('AIR service not initialized');
  //   }
  //   this.airService.on(event, callback);
  //   console.log(`📡 Subscribed to AIR event: ${event}`);
  // }

  // Helper to get issuer auth token
  private async getIssuerAuthToken(): Promise<string> {
    const response = await fetch(`${ENVIRONMENT_CONFIG.apiUrl}/issuer/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        "X-Test": "true",
      },
      body: JSON.stringify({
        issuerDid: ISSUER_DID,
        authToken: ISSUER_API_KEY,
      }),
    });

    if (!response.ok) {
      throw new Error(`Issuer auth failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.code === 80000000 && data.data?.token) {
      return data.data.token;
    }

    throw new Error('Failed to get issuer auth token');
  }

  // Helper to get verifier auth token
  private async getVerifierAuthToken(): Promise<string> {
    const response = await fetch(`${ENVIRONMENT_CONFIG.apiUrl}/verifier/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        "X-Test": "true",
      },
      body: JSON.stringify({
        verifierDid: VERIFIER_DID,
        authToken: VERIFIER_API_KEY,
      }),
    });

    if (!response.ok) {
      throw new Error(`Verifier auth failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.code === 80000000 && data.data?.token) {
      return data.data.token;
    }

    throw new Error('Failed to get verifier auth token');
  }

  // Credential Issuance
  async issueCredential(
    credentialSubject: JsonDocumentObject,
    onSuccess?: () => void,
    onError?: (error: any) => void
  ): Promise<void> {
    try {
      console.log('🎫 Starting credential issuance...');
      
      await this.initialize();
      
      const [partnerUrl, issuerAuth] = await Promise.all([
        this.getPartnerUrl(),
        this.getIssuerAuthToken()
      ]);

      const claimRequest: ClaimRequest = {
        process: "Issue",
        issuerDid: ISSUER_DID,
        issuerAuth: issuerAuth,
        credentialId: CREDENTIAL_ID,
        credentialSubject: credentialSubject,
      };

      const widget = new AirCredentialWidget(claimRequest, PARTNER_ID, {
        endpoint: partnerUrl,
        airKitBuildEnv: BUILD_ENVIRONMENT,
        theme: "light",
        locale: "en" as Language,
      });

      widget.on("issueCompleted", () => {
        console.log('✅ Credential issuance completed');
        onSuccess?.();
      });

      widget.on("close", () => {
        console.log('🔒 Widget closed');
        onError?.(new Error('Widget closed'));
      });

      widget.launch();
      console.log('🚀 Credential widget launched');

    } catch (error) {
      console.error('❌ Credential issuance failed:', error);
      onError?.(error);
    }
  }

  // Credential Verification
  async verifyCredential(
    programId: string,
    onSuccess?: (result: any) => void,
    onError?: (error: any) => void,
    onNonCompliant?: () => void,
    onNotFound?: () => void
  ): Promise<void> {
    try {
      console.log('🔍 Starting credential verification with programId:', programId);
      
      await this.initialize();
      
      const [partnerUrl, verifierAuth] = await Promise.all([
        this.getPartnerUrl(),
        this.getVerifierAuthToken()
      ]);

      const queryRequest: QueryRequest = {
        process: "Verify",
        verifierAuth: verifierAuth,
        programId: programId,
      };

      const widget = new AirCredentialWidget(queryRequest, PARTNER_ID, {
        endpoint: partnerUrl,
        airKitBuildEnv: BUILD_ENVIRONMENT,
        theme: "light",
        locale: "en" as Language,
        redirectUrlForIssuer: process.env.NEXT_PUBLIC_FRONTEND_URL + '/create' || ''
      });

      widget.on("verifyCompleted", (results: { status: string }) => {
        console.log("verification results....",results)
        if (results.status === 'Compliant') {
          console.log('✅ Credential verification successful');
          onSuccess?.(results);
        } else if (results.status === 'Non-Compliant') {
          console.log('⚠️ Credential verification failed - non-compliant');
          onNonCompliant?.();
        } else if (results.status === 'NotFound') {
          console.log('🔍 No credentials found - redirecting to profile creation');
          onNotFound?.(); 
        } else {
          console.log('❓ Verification completed with status:', results.status);
          onError?.(new Error(`Verification status: ${results.status}`));
        }
      });

      widget.on("close", () => {
        console.log('🔒 Verification widget closed');
      });

      widget.launch();
      console.log('🚀 Verification widget launched');

    } catch (error) {
      console.error('❌ Credential verification failed:', error);
      onError?.(error);
    }
  }

  // Check if properly configured
  isConfigured(): boolean {
    return !!(PARTNER_ID && ISSUER_DID && ISSUER_API_KEY && VERIFIER_DID && VERIFIER_API_KEY && CREDENTIAL_ID && PROGRAM_ID);
  }

  // Cleanup
  cleanup(): void {
    this.airService?.cleanUp();
    this.airService = null;
    this.isInitialized = false;
  }

  // Check if AIR service is properly configured
  debugAirEnvironment(): void {
    console.log('🔧 AIR Environment Debug:', {
      PARTNER_ID: PARTNER_ID || 'NOT SET',
      ISSUER_DID: ISSUER_DID ? `${ISSUER_DID.slice(0, 10)}...` : 'NOT SET',
      ISSUER_API_KEY: ISSUER_API_KEY ? `${ISSUER_API_KEY.slice(0, 10)}...` : 'NOT SET',
      VERIFIER_DID: VERIFIER_DID ? `${VERIFIER_DID.slice(0, 10)}...` : 'NOT SET',
      VERIFIER_API_KEY: VERIFIER_API_KEY ? `${VERIFIER_API_KEY.slice(0, 10)}...` : 'NOT SET',
      CREDENTIAL_ID: CREDENTIAL_ID || 'NOT SET',
      PROGRAM_ID: PROGRAM_ID || 'NOT SET',
      isConfigured: this.isConfigured()
    });
  }

  // Check if there's an existing session (without initializing if not configured)
  async checkExistingSession(): Promise<boolean> {
    try {
      console.log('🔍 Checking for existing AIR session...');
      
      if (!this.isConfigured()) {
        console.warn('⚠️ AIR not configured, cannot check session');
        this.debugAirEnvironment();
        return false;
      }

      if (this.isInitialized) {
        console.log('✅ AIR already initialized, checking status');
        return this.getLoginStatus();
      }

      // Initialize and login if not already done
      if (!this.airService) {
        this.airService = new AirService({ 
          partnerId: PARTNER_ID,
          modalZIndex: 99999 
        });

        await this.airService.init({ 
          buildEnv: BUILD_ENVIRONMENT, 
          enableLogging: true, 
          skipRehydration: false 
        });
        this.isInitialized = true;
      }

      // If not logged in, try to login
      if (!this.isLoggedIn) {
        console.log('🔑 Attempting AIR login...');
        try {
          const loginResult = await this.airService.login();
          console.log('✅ AIR login successful:', loginResult);
          this.isLoggedIn = true;
          return true;
        } catch (loginError) {
          console.log('ℹ️ AIR login failed or no session:', loginError);
          this.isLoggedIn = false;
          return false;
        }
      }

      // Already logged in
      console.log('✅ Already logged in to AIR');
      return true;
    } catch (error) {
      console.error('❌ Error checking existing session:', error);
      return false;
    }
  }
}

// Export singleton instance
export const klyroAirService = new KlyroAirService();

// Export helper function to check user credentials via API
export async function checkUserCredential(githubUsername: string): Promise<{
  hasCredential: boolean;
  status: string | null;
  credentialId?: string;
  issuerDid?: string;
  issuedAt?: string;
}> {
  try {
    console.log('🔍 Checking credentials for user:', githubUsername);
    
    // Import api client here to avoid circular imports
    const { api } = await import('@/lib/axiosClient');
    const response = await api.get(`/fbi/credentials/${githubUsername}`);
    
    console.log('🔍 Credential check response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Credential data found:', response.data.data);
      return response.data.data;
    } else {
      console.log('❌ Credential check failed:', response.data.error);
      throw new Error(response.data.error || 'Failed to check credential');
    }
  } catch (error) {
    console.error('❌ Error checking user credential:', error);
    return {
      hasCredential: false,
      status: null
    };
  }
} 