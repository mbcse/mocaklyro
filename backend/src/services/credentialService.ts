import { Logger } from '../common/utils/logger.js';

// AIR Kit Environment Configuration
const BUILD_ENV = {
  STAGING: 'STAGING',
  SANDBOX: 'SANDBOX'
} as const;

interface EnvironmentConfig {
  widgetUrl: string;
  apiUrl: string;
}

const ENVIRONMENT_CONFIGS: Record<string, EnvironmentConfig> = {
  [BUILD_ENV.STAGING]: {
    widgetUrl: "https://credential-widget.test.air3.com",
    apiUrl: "https://credential.api.test.air3.com",
  },
  [BUILD_ENV.SANDBOX]: {
    widgetUrl: "https://credential-widget.sandbox.air3.com",
    apiUrl: "https://credential.api.sandbox.air3.com",
  },
};

const getEnvironmentConfig = (env: string): EnvironmentConfig => {
  return ENVIRONMENT_CONFIGS[env] || ENVIRONMENT_CONFIGS[BUILD_ENV.SANDBOX];
};

interface KlyroCredentialSubject {
  id: string; // required
  githubUsername: string;
  name?: string;
  email?: string;
  location?: string;
  followers: number;
  totalRepositories: number;
  totalStars: number;
  totalForks: number;
  totalContributions: number;
  totalPullRequests: number;
  totalIssues: number;
  totalLinesOfCode: number;
  solidityLinesOfCode: number;
  accountAge: number;
  KlyroScore: number; // Back to KlyroScore as per actual schema
  web3Score: number; // Will be converted to integer
  developerWorth: number; // Will be converted to integer
  totalTransactions: number;
  mainnetContracts: number;
  testnetContracts: number;
  hackathonParticipations: string; // Back to string as per actual schema
  hackathonWins: number;
  totalTVL: number; // Will be converted to integer
  uniqueUsers: number;
  lastUpdated: string;
  verificationLevel: string;
}

interface IssueCredentialRequest {
  issuerDid: string;
  credentialId: string;
  credentialSubject: KlyroCredentialSubject;
}

interface IssueCredentialResponse {
  success: boolean;
  credentialHash?: string;
  credentialId?: string;
  issuerDid?: string;
  error?: string;
}

class CredentialService {
  private readonly environmentConfig: EnvironmentConfig;
  private readonly issuerDid: string;
  private readonly issuerApiKey: string;
  private readonly credentialId: string;

  constructor() {
    const buildEnv = process.env.AIR_BUILD_ENV || BUILD_ENV.SANDBOX;
    this.environmentConfig = getEnvironmentConfig(buildEnv);
    this.issuerDid = process.env.AIR_ISSUER_DID || '';
    this.issuerApiKey = process.env.AIR_ISSUER_API_KEY || '';
    this.credentialId = process.env.AIR_CREDENTIAL_ID || '';

    if (!this.issuerDid || !this.issuerApiKey || !this.credentialId) {
      Logger.warn('CredentialService', 'AIR credential configuration missing. Credential issuing will be disabled.');
    }

    Logger.info('CredentialService', `Initialized with environment: ${buildEnv}`, {
      apiUrl: this.environmentConfig.apiUrl,
      widgetUrl: this.environmentConfig.widgetUrl
    });
  }

  /**
   * Helper function to provide meaningful default values for credential fields
   */
  private getDefaultValue(value: any, type: 'string' | 'number' | 'email' | 'location' | 'username'): any {
    // Handle null, undefined, empty string, or whitespace-only strings
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      switch (type) {
        case 'string':
          return 'N/A';
        case 'email':
          return 'No Email';
        case 'location':
          return 'None';
        case 'username':
          return 'Unknown';
        case 'number':
          return 0;
        default:
          return 'N/A';
      }
    }

    // Handle numbers - ensure they're valid
    if (type === 'number') {
      const num = Number(value);
      return isNaN(num) ? 0 : Math.max(0, Math.floor(num));
    }

    // Handle strings - trim and return
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed || this.getDefaultValue(null, type);
    }

    return value;
  }

  private async getIssuerAuthToken(): Promise<string | null> {
    try {
      const response = await fetch(`${this.environmentConfig.apiUrl}/issuer/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*',
          'X-Test': 'true',
        },
        body: JSON.stringify({
          issuerDid: this.issuerDid,
          authToken: this.issuerApiKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const data = await response.json();
      if (data.code === 80000000 && data.data && data.data.token) {
        return data.data.token;
      } else {
        Logger.error('CredentialService', 'Failed to get issuer auth token from API:', data.msg || 'Unknown error');
        return null;
      }
    } catch (error) {
      Logger.error('CredentialService', 'Error fetching issuer auth token:', error);
      return null;
    }
  }

  async issueCredential(userData: {
    githubData: any;
    userScore: any;
    developerWorth?: any;
    contractsData?: any;
    onchainData?: any;
    walletAddress?: string;
    email?: string;
  }): Promise<IssueCredentialResponse> {
    try {
      if (!this.issuerDid || !this.issuerApiKey || !this.credentialId) {
        return {
          success: false,
          error: 'AIR credential configuration missing'
        };
      }

      const authToken = await this.getIssuerAuthToken();
      if (!authToken) {
        return {
          success: false,
          error: 'Failed to get issuer auth token'
        };
      }

      // Prepare credential subject data according to Klyro schema
      const githubData = userData.githubData || {};
      const userScore = userData.userScore || {};
      const developerWorth = userData.developerWorth || {};
      const contractsData = userData.contractsData || {};
      const onchainData = userData.onchainData || {};
      
      // Calculate account age from GitHub creation date
      const accountCreatedAt = new Date(githubData.created_at || Date.now());
      const accountAge = Math.max(1, new Date().getFullYear() - accountCreatedAt.getFullYear());
      
      // Extract transaction stats
      const transactionStats = onchainData.transactionStats?.total || {};
      const contractStats = onchainData.contractStats?.total || {};
      
      // Calculate total lines of code (approximation based on repos and languages)
      const totalLinesOfCode = userScore.totalLinesOfCode || 
        Math.floor((githubData.public_repos || 0) * 1000); // Rough estimate
      
      // Calculate Solidity LOC (approximation)
      const solidityLinesOfCode = Math.floor(totalLinesOfCode * 0.1); // Assume 10% is Solidity
      
      // Extract hackathon data
      const hackathonData = onchainData.hackathonData || {};
      const hackathonWins = hackathonData.totalWins || 0;
      const hackathonParticipations = hackathonData.totalHackerExperience || 0;
      
      const credentialSubject: KlyroCredentialSubject = {
        id: `did:klyro:${this.getDefaultValue(githubData.login, 'username')}`,
        githubUsername: this.getDefaultValue(githubData.login, 'username'),
        name: this.getDefaultValue(githubData.name, 'string'),
        email: this.getDefaultValue(userData.email || githubData.email, 'email'),
        location: this.getDefaultValue(githubData.location, 'location'),
        followers: this.getDefaultValue(githubData.followers, 'number'),
        totalRepositories: this.getDefaultValue(githubData.public_repos, 'number'),
        totalStars: this.getDefaultValue(userScore.githubStars, 'number'),
        totalForks: this.getDefaultValue(userScore.totalForks, 'number'),
        totalContributions: this.getDefaultValue(userScore.contributionCount, 'number'),
        totalPullRequests: this.getDefaultValue(userScore.totalPRs, 'number'),
        totalIssues: this.getDefaultValue(userScore.totalIssues, 'number'),
        totalLinesOfCode: this.getDefaultValue(totalLinesOfCode, 'number'),
        solidityLinesOfCode: this.getDefaultValue(solidityLinesOfCode, 'number'),
        accountAge: this.getDefaultValue(accountAge, 'number'),
        KlyroScore: this.getDefaultValue(userScore.totalScore, 'number'),
        web3Score: this.getDefaultValue(userScore.onchainScore, 'number'),
        developerWorth: this.getDefaultValue(developerWorth.totalWorth, 'number'),
        totalTransactions: this.getDefaultValue(transactionStats.total, 'number'),
        mainnetContracts: this.getDefaultValue(contractStats.mainnet, 'number'),
        testnetContracts: this.getDefaultValue(contractStats.testnet, 'number'),
        hackathonParticipations: this.getDefaultValue(hackathonParticipations, 'number').toString(),
        hackathonWins: this.getDefaultValue(hackathonWins, 'number'),
        totalTVL: this.getDefaultValue(0, 'number'), // Default to 0 as this is not calculated yet
        uniqueUsers: this.getDefaultValue(0, 'number'), // Default to 0 as this is not calculated yet
        lastUpdated: new Date().toISOString(),
        verificationLevel: userScore.totalScore > 500 ? 'PREMIUM' : userScore.totalScore > 200 ? 'VERIFIED' : 'BASIC',
      };

      // Issue credential via AIR API
      const issueResponse = await fetch(`${this.environmentConfig.apiUrl}/issuer/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'accept': '*/*',
        },
        body: JSON.stringify({
          credentialId: this.credentialId,
          credentialSubject: credentialSubject
        }),
      });

      if (!issueResponse.ok) {
        throw new Error(`Credential issuing failed with status: ${issueResponse.status}`);
      }

      const issueData = await issueResponse.json();
      
      if (issueData.code === 80000000 && issueData.data) {
        Logger.info('CredentialService', 'Successfully issued credential', { 
          credentialId: this.credentialId,
          issuerDid: this.issuerDid 
        });
        
        return {
          success: true,
          credentialHash: issueData.data.credentialHash,
          credentialId: this.credentialId,
          issuerDid: this.issuerDid
        };
      } else {
        Logger.error('CredentialService', 'Failed to issue credential:', issueData.msg || 'Unknown error');
        return {
          success: false,
          error: issueData.msg || 'Unknown error'
        };
      }

    } catch (error) {
      Logger.error('CredentialService', 'Error issuing credential:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  isConfigured(): boolean {
    return !!(this.issuerDid && this.issuerApiKey && this.credentialId);
  }
}

export const credentialService = new CredentialService();
export type { KlyroCredentialSubject, IssueCredentialRequest, IssueCredentialResponse }; 