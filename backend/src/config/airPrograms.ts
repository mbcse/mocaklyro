// AIR Credential Requirements Configuration
// Each requirement has its own specific program ID

export interface AirCredentialRequirement {
  id: string;
  label: string;
  description: string;
  programId: string; // AIR program ID for this specific requirement
  type: 'number' | 'boolean' | 'string';
  isActive: boolean;
}

export const AIR_CREDENTIAL_REQUIREMENTS: AirCredentialRequirement[] = [
  {
    id: "total_contributions",
    label: "Total Contributions",
    description: "Minimum number of GitHub contributions",
    programId: "c21hh030dz4gm00q2097PJ", // totalContributionsverify
    type: "number",
    isActive: true
  },
  {
    id: "hackathon_wins",
    label: "Hackathon Wins", 
    description: "Number of hackathon wins achieved",
    programId: "c21hi031a5dpk01e2097Ir", // KlyroHackathonWinsVerify
    type: "number",
    isActive: true
  },
  {
    id: "mainnet_contracts",
    label: "Mainnet Contracts",
    description: "Minimum number of mainnet smart contracts deployed", 
    programId: "c21hi031a9je101f2097Ff", // MainnetContractsVerify
    type: "number",
    isActive: true
  },
  {
    id: "testnet_contracts",
    label: "Testnet Contracts",
    description: "Minimum number of testnet smart contracts deployed",
    programId: "c21hi031aar6i01g2097rA", // TestnetContractsVerify
    type: "number",
    isActive: true
  },
  {
    id: "klyro_score",
    label: "Klyro Score",
    description: "Minimum Klyro developer score required",
    programId: "c21hi031addb601h2097Dv", // KlyroScoreVerify
    type: "number", 
    isActive: true
  },
  {
    id: "web3_score",
    label: "Web3 Score",
    description: "Minimum Web3 development score",
    programId: "c21hi031aeqci01i2097qr", // web3scoreverify
    type: "number",
    isActive: true
  }
];

// Helper function to get active credential requirements
export const getActiveCredentialRequirements = (): AirCredentialRequirement[] => {
  return AIR_CREDENTIAL_REQUIREMENTS.filter(requirement => requirement.isActive);
};

// Helper function to get requirement by ID
export const getRequirementById = (id: string): AirCredentialRequirement | undefined => {
  return AIR_CREDENTIAL_REQUIREMENTS.find(requirement => requirement.id === id);
}; 