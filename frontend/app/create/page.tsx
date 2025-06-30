"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, X, Github, Wallet, Twitter, Loader2, CheckCircle, AlertCircle, Mail, Shield } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/axiosClient";
import { isAddress } from "ethers";
import { klyroAirService } from "@/lib/airService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Define types for the API responses
type ProgressStatus = "PROCESSING" | "COMPLETED" | "FAILED" | "READY" | "PENDING";

interface ProgressData {
  githubData: ProgressStatus;
  contractsData: ProgressStatus;
  onchainData: ProgressStatus;
  credentialIssuing: ProgressStatus;
}

interface StatusResponse {
  success: boolean;
  data: {
    status: ProgressStatus;
    progress?: ProgressData;
    userData?: any;
    readyForCredentials?: boolean;
  };
}

// Helper function to validate wallet addresses or ENS names
const isValidAddress = (address: string): boolean => {
  if (!address) return true; // Empty is allowed as only first is required
  
  // Check if it's a valid Ethereum address
  if (isAddress(address)) return true;
  
  const addressStr = address as string; // Explicitly type as string
  if (addressStr.endsWith('.eth') || addressStr.endsWith('.base.eth')) {
    const parts = addressStr.split('.');
    // Basic validation - ensure there's something before .eth
    return parts[0].length > 0;
  }
  
  return false;
};

const isValidGithubUsername = (username: string): boolean => {
  // Only allow alphanumeric, hyphens, and must not start with @ or contain github.com
  if (!username) return false;
  if (username.startsWith("@")) return false;
  if (username.includes("github.com")) return false;
  if (/^https?:\/\//.test(username)) return false;
  // GitHub usernames: 1-39 chars, alphanumeric or hyphen, cannot start/end with hyphen, no consecutive hyphens
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username);
};

// Add email validation function
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function UserDataForm() {
  const [isAirLoggedIn, setIsAirLoggedIn] = useState(false);
  const [airLoginLoading, setAirLoginLoading] = useState(false);
  const [checkingAirStatus, setCheckingAirStatus] = useState(true);
  
  const [wallets, setWallets] = useState([{ id: 1, address: "", isValid: true }]);
  const [githubUsername, setGithubUsername] = useState("");
  const [githubUsernameTouched, setGithubUsernameTouched] = useState(false);
  const [twitterUsername, setTwitterUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [githubUsernameError, setGithubUsernameError] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [credentialProcessingState, setCredentialProcessingState] = useState<'not_started' | 'processing' | 'completed'>('not_started');
  
  // Use ref to prevent re-rendering issues
  const credentialProcessingRef = useRef<'not_started' | 'processing' | 'completed'>('not_started');

  const githubUsernameIsValid = isValidGithubUsername(githubUsername);

  useEffect(() => {
    const checkAirStatus = async () => {
      try {
        if (!klyroAirService.isConfigured()) {
          setCheckingAirStatus(false);
          return;
        }
        await klyroAirService.initialize();
        const isLoggedIn = klyroAirService.getLoginStatus();
        setIsAirLoggedIn(isLoggedIn);
      } catch (error) {
        console.error("AIR status check failed:", error);
      } finally {
        setCheckingAirStatus(false);
      }
    };

    checkAirStatus();

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  const handleAirLogin = async () => {
    setAirLoginLoading(true);
    try {
      await klyroAirService.initialize();
      setIsAirLoggedIn(true);
    } catch (error) {
      console.error("AIR login failed:", error);
    } finally {
      setAirLoginLoading(false);
    }
  };

  const addWallet = () => {
    if (wallets.length < 5) {
      setWallets([...wallets, { id: Date.now(), address: "", isValid: true }]);
    }
  };

  const removeWallet = (id: number) => {
    if (wallets.length > 1) {
      setWallets(wallets.filter(wallet => wallet.id !== id));
    }
  };

  const updateWallet = (id: number, address: string) => {
    setWallets(wallets.map(wallet => 
      wallet.id === id ? { ...wallet, address, isValid: isValidAddress(address) } : wallet
    ));
  };

  const issueCredentials = useCallback(async (username: string) => {
    // Check ref value to prevent race conditions
    if (credentialProcessingRef.current !== 'not_started') {
      console.log('🔒 Credential processing already in progress or completed, skipping...');
      return;
    }
    
    // IMMEDIATELY set to processing to block any other calls
    console.log('🎫 Starting credential issuance for:', username);
    credentialProcessingRef.current = 'processing';
    setCredentialProcessingState('processing');
    
    try {
      // Get latest user data for credential
      const userResponse = await api.get(`/fbi/status/${username}`);
      const userData = userResponse.data.data;
      
      // DEBUG: Log the actual response structure
      console.log('🔍 Full userData structure:', JSON.stringify(userData, null, 2));
      console.log('🔍 userData.userRepoData:', userData.userRepoData);
      console.log('🔍 userData.contributionData:', userData.contributionData);
      console.log('🔍 userData.score:', userData.score);
      console.log('🔍 userData.developerWorth:', userData.developerWorth);
      console.log('🔍 userData.contractStats:', userData.contractStats);
      console.log('🔍 userData.transactionStats:', userData.transactionStats);
      console.log('🔍 userData.hackathonData:', userData.hackathonData);
      
      // Helper function to provide meaningful default values
      const getDefaultValue = (value: any, type: 'string' | 'number' | 'email' | 'location' | 'username'): any => {
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
          return trimmed || getDefaultValue(null, type);
        }

        return value;
      };

      // Prepare credential subject with default values
      const credentialSubject = {
        id: `did:klyro:${getDefaultValue(username, 'username')}`,
        githubUsername: getDefaultValue(username, 'username'),
        name: getDefaultValue(userData.userData?.name, 'string'),
        email: getDefaultValue(email, 'email'),
        location: getDefaultValue(userData.userData?.location, 'location'),
        followers: getDefaultValue(userData.userData?.followers, 'number'),
        totalRepositories: getDefaultValue(userData.userData?.public_repos, 'number'),
        totalStars: getDefaultValue(userData.userRepoData?.totalStars, 'number'),
        totalForks: getDefaultValue(userData.userRepoData?.totalForks, 'number'),
        totalContributions: getDefaultValue(userData.contributionData?.totalContributions, 'number'),
        totalPullRequests: getDefaultValue(userData.contributionData?.totalPRs, 'number'),
        totalIssues: getDefaultValue(userData.contributionData?.totalIssues, 'number'),
        totalLinesOfCode: getDefaultValue(userData.contributionData?.totalLinesOfCode, 'number'),
        solidityLinesOfCode: getDefaultValue(Math.floor((userData.contributionData?.totalLinesOfCode || 0) * 0.1), 'number'),
        accountAge: getDefaultValue(Math.max(1, new Date().getFullYear() - new Date(userData.userData?.created_at || Date.now()).getFullYear()), 'number'),
        KlyroScore: getDefaultValue(userData.score?.totalScore, 'number'),
        web3Score: getDefaultValue(userData.score?.metrics?.web3?.total, 'number'),
        developerWorth: getDefaultValue(userData.developerWorth?.totalWorth, 'number'),
        totalTransactions: getDefaultValue(userData.transactionStats?.total?.total, 'number'),
        mainnetContracts: getDefaultValue(userData.contractStats?.total?.mainnet, 'number'),
        testnetContracts: getDefaultValue(userData.contractStats?.total?.testnet, 'number'),
        hackathonParticipations: getDefaultValue(userData.hackathonData?.totalHackerExperience || userData.hackathonData?.HACKER?.count, 'number').toString(),
        hackathonWins: getDefaultValue(userData.hackathonData?.totalWins || userData.hackathonData?.WINS?.count, 'number'),
        totalTVL: getDefaultValue(0, 'number'), // Default to 0 as this is not calculated yet
        uniqueUsers: getDefaultValue(0, 'number'), // Default to 0 as this is not calculated yet
        lastUpdated: new Date().toISOString(),
        verificationLevel: userData.score?.totalScore > 500 ? 'PREMIUM' : userData.score?.totalScore > 200 ? 'VERIFIED' : 'BASIC',
      };

      console.log('🎯 Final credentialSubject:', credentialSubject);

      // Issue credential via AIR widget
      await klyroAirService.issueCredential(
        credentialSubject,
        async () => {
          console.log('✅ Credential issued successfully');
          credentialProcessingRef.current = 'completed';
          setCredentialProcessingState('completed');
          
          // Update backend that credentials were issued
          try {
            console.log('📤 Updating backend credential status for:', username);
            const updateResponse = await api.post('/fbi/update-credential-status', {
              githubUsername: username,
              status: 'ISSUED'
            });
            console.log('✅ Backend credential status update response:', updateResponse.data);
          } catch (error) {
            console.error('❌ Failed to update credential status in backend:', error);
          }
        },
        (error: any) => {
          console.error('❌ Credential issuing failed:', error);
          credentialProcessingRef.current = 'not_started';
          setCredentialProcessingState('not_started'); // Reset on failure to allow retry
        }
      );
      
    } catch (error) {
      console.error('❌ Error in credential issuing process:', error);
      credentialProcessingRef.current = 'not_started';
      setCredentialProcessingState('not_started'); // Reset on error to allow retry
    }
  }, [email]);

  const startPolling = useCallback((username: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get<StatusResponse>(`/fbi/status/${username}`);
        setStatusData(response.data);
        
        // Check if backend processing is ready for credential issuing
        // Use ref to check state without causing re-renders
        if (response.data.data.readyForCredentials && credentialProcessingRef.current === 'not_started') {
          console.log('🚀 Backend ready, triggering credential issuance...');
          await issueCredentials(username);
        }
        
        if (response.data.data.status === "COMPLETED") {
          clearInterval(interval);
          setTimeout(() => {
            window.location.href = `/${username}`;
          }, 2000);
        } else if (response.data.data.status === "FAILED") {
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Error polling status:", error);
      }
    }, 3000);
    
    setPollingInterval(interval);
  }, [issueCredentials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!githubUsernameIsValid) {
      setGithubUsernameTouched(true);
      return;
    }
    
    const allValid = wallets.every(wallet => {
      if (!wallet.address) return true;
      return isValidAddress(wallet.address);
    });
    
    if (!allValid) {
      setWallets(wallets.map(wallet => ({
        ...wallet,
        isValid: !wallet.address || isValidAddress(wallet.address)
      })));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        githubUsername: githubUsername.trim(),
        addresses: wallets.map(w => w.address).filter(a => a.trim() !== ""),
        email: email.trim()
      };
      
      await api.post("/fbi/analyze-user", payload);
      setIsModalOpen(true);
      startPolling(githubUsername.trim());
      
    } catch (error: any) {
      console.error("Error submitting form:", error);
      if(error?.response?.data?.error === "Invalid github username") {
        setGithubUsernameError("Invalid Github username");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render status icons
  const getStatusIcon = (status: ProgressStatus) => {
    switch (status) {
      case "PROCESSING":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "FAILED":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "READY":
        return <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
  };

  // Calculate overall progress percentage
  const calculateProgress = () => {
    if (!statusData?.data?.progress) return 0;
    
    const progressItems = Object.values(statusData.data.progress);
    const completedItems = progressItems.filter(item => item === "COMPLETED").length;
    return Math.floor((completedItems / progressItems.length) * 100);
  };

  if (checkingAirStatus) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mx-auto mb-3" />
          <p>Initializing AIR authentication...</p>
        </div>
      </div>
    );
  }

  if (!klyroAirService.isConfigured()) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">AIR Authentication Required</h1>
          <p className="text-zinc-400">
            AIR credentials are not properly configured. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  if (!isAirLoggedIn) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center">
        <div className="text-center max-w-md">
          <Shield className="h-16 w-16 text-indigo-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4">Secure Profile Creation</h1>
          <p className="text-zinc-400 mb-6">
            To create your Klyro profile with verifiable credentials, you need to authenticate with AIR first.
          </p>
          <Button
            onClick={handleAirLogin}
            disabled={airLoginLoading}
            className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3"
          >
            {airLoginLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Login with AIR"
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      <div className="w-full max-w-2xl mx-auto p-6 md:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Create your Klyro Profile</h1>
          <p className="text-zinc-400">
            Link your data and get a shareable builder profile with verifiable credentials.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 backdrop-blur-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail size={16} className="text-zinc-400" />
                Email <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailTouched(true);
                    if (!isValidEmail(e.target.value)) {
                      setEmailError("Please enter a valid email address");
                    } else {
                      setEmailError(null);
                    }
                  }}
                  onBlur={() => {
                    setEmailTouched(true);
                    if (!isValidEmail(email)) {
                      setEmailError("Please enter a valid email address");
                    } else {
                      setEmailError(null);
                    }
                  }}
                  placeholder="Enter your email"
                  className={`bg-zinc-900/70 border-zinc-800 h-11 pl-3 focus:ring-blue-500 focus:border-blue-500 ${emailTouched && emailError ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              {emailTouched && emailError && (
                <p className="text-red-500 text-xs mt-1 pl-1">
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="github" className="flex items-center gap-2">
                <Github size={16} className="text-zinc-400" />
                GitHub Username Only <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="github"
                  type="text"
                  value={githubUsername}
                  onChange={(e) => {
                    setGithubUsername(e.target.value);
                    setGithubUsernameTouched(true);
                    setGithubUsernameError(null);
                  }}
                  onBlur={() => setGithubUsernameTouched(true)}
                  placeholder="Enter your GitHub username"
                  className={`bg-zinc-900/70 border-zinc-800 h-11 pl-3 focus:ring-blue-500 focus:border-blue-500 ${githubUsernameTouched && !githubUsernameIsValid ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                <span className="bg-zinc-800 px-2 py-0.5 rounded">github.com / @username</span>
                <span className="text-zinc-500">We accept only username</span>
              </div>
              {githubUsernameTouched && !githubUsernameIsValid && (
                <p className="text-red-500 text-xs mt-1 pl-1">
                  Please enter only your GitHub username (not a URL or @username)
                </p>
              )}
              {githubUsernameError && (
                <p className="text-red-500 text-xs mt-1 pl-1">
                  {githubUsernameError}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Wallet size={16} className="text-zinc-400" />
                Wallet Addresses
                <span className="text-xs text-zinc-500 ml-1">(Optional - Ethereum address, ENS or Base ENS)</span>
              </Label>
              
              {wallets.map((wallet, index) => (
                <div key={wallet.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={wallet.address}
                      onChange={(e) => updateWallet(wallet.id, e.target.value)}
                      placeholder={`Wallet address ${index + 1}`}
                      className={`bg-zinc-900/70 border-zinc-800 h-11 pl-3 focus:ring-blue-500 focus:border-blue-500 ${!wallet.isValid ? 'border-red-500' : ''}`}
                    />
                    {wallets.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeWallet(wallet.id)}
                        className="h-10 w-10 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                  {!wallet.isValid && wallet.address && (
                    <p className="text-red-500 text-xs pl-1">
                      Please enter a valid Ethereum address, ENS domain (.eth) or Base ENS domain (.base.eth)
                    </p>
                  )}
                </div>
              ))}
              
              {wallets.length < 5 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addWallet}
                  className="text-blue-400 hover:text-blue-300 hover:bg-zinc-900 mt-2"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Add Another Wallet Address
                </Button>
              )}
              <p className="text-xs text-amber-500 mt-2">
                Note: Not providing any wallet addresses will reduce your profile score as we won't be able to analyze your on-chain activity.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter" className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.99 0H20.298L13.071 8.26004L21.573 19.5H14.916L9.70202 12.683L3.73597 19.5H0.426L8.15602 10.665L0 0H6.82602L11.539 6.23104L16.99 0ZM15.829 17.52H17.662L5.83002 1.876H3.86297L15.829 17.52Z" fill="#ffffff"></path></svg>
                Twitter Username
              </Label>
              <div className="relative">
                <Input
                  id="twitter"
                  type="text"
                  value={twitterUsername}
                  onChange={(e) => setTwitterUsername(e.target.value)}
                  placeholder="Enter your Twitter username"
                  className="bg-zinc-900/70 border-zinc-800 h-11 pl-3 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : "Create My Profile"}
              </Button>
            </div>

            <div className="text-center text-sm text-zinc-500 pt-2">
              By connecting your accounts, you agree to our{" "}
              <Link href="/terms" className="text-blue-400 hover:text-blue-300">
                Terms of Service
              </Link>
            </div>
          </form>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold mb-2">Building your profile</DialogTitle>
            <DialogDescription className="text-zinc-400">
              We're analyzing your data and issuing verifiable credentials automatically
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall progress</span>
                <span>{calculateProgress()}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(statusData?.data?.progress?.githubData || "PROCESSING")}
                  <span>Loading GitHub Data</span>
                </div>
                <span className="text-xs text-zinc-500">
                  {statusData?.data?.progress?.githubData === "COMPLETED" ? "Done" : "In progress"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(statusData?.data?.progress?.contractsData || "PROCESSING")}
                  <span>Analyzing Contract Deployments</span>
                </div>
                <span className="text-xs text-zinc-500">
                  {statusData?.data?.progress?.contractsData === "COMPLETED" ? "Done" : "In progress"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(statusData?.data?.progress?.onchainData || "PROCESSING")}
                  <span>Analyzing On-chain Activity</span>
                </div>
                <span className="text-xs text-zinc-500">
                  {statusData?.data?.progress?.onchainData === "COMPLETED" ? "Done" : "In progress"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(statusData?.data?.progress?.credentialIssuing || "PENDING")}
                  <span>Issuing AIR Credentials</span>
                </div>
                <span className="text-xs text-zinc-500">
                  {statusData?.data?.progress?.credentialIssuing === "COMPLETED" ? "Done" : 
                   credentialProcessingState === 'processing' ? "Issuing..." :
                   statusData?.data?.progress?.credentialIssuing === "READY" ? "Ready to issue" : "Waiting for data"}
                </span>
              </div>
            </div>
            
            {statusData?.data?.status === "FAILED" && (
              <div className="mt-4 p-3 bg-red-900/30 text-red-300 border border-red-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Analysis failed</span>
                </div>
                <p className="mt-1 text-sm">
                  There was an issue analyzing your profile. This could be due to API limits or server issues. Please try again later.
                </p>
              </div>
            )}
            
            {statusData?.data?.status === "COMPLETED" && (
              <div className="mt-4 p-3 bg-green-900/30 text-green-300 border border-green-900 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Profile complete with verifiable credentials! Redirecting...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
