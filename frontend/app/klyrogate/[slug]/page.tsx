"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Check, X, Clock, User, AlertCircle, Zap, ExternalLink, Loader2, LogOut, Wallet } from "lucide-react";
import { klyroAirService } from "@/lib/airService";
import { api } from "@/lib/axiosClient";

interface KlyroGate {
  id: string;
  name: string;
  slug: string;
  description: string;
  organization: {
    id: string;
    name: string;
    description?: string;
    website?: string;
    logoUrl?: string;
  };
  isActive: boolean;
  primaryColor?: string;
  bannerUrl?: string;
  customMessage?: string;
  actionType: string;
  actionUrl: string;
  successMessage: string;
  credentialRequirements: Array<{
    credentialType: string;
    programId: string;
    minValue?: number;
    stringValue?: string;
    isRequired: boolean;
  }>;
}

const CREDENTIAL_TYPE_LABELS: Record<string, string> = {
  "github_commits": "GitHub Commits",
  "solidity_experience": "Solidity Experience",
  "onchain_activity": "Onchain Activity",
  "developer_score": "Developer Score",
  "salary_range": "Salary Range",
  "hackathon_participation": "Hackathon Participation",
  "years_experience": "Years of Experience",
  "specific_tech": "Specific Technology"
};

// Helper function to convert hex to RGB
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export default function KlyroGatePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [gateData, setGateData] = useState<KlyroGate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [airUserInfo, setAirUserInfo] = useState<any>(null);
  const [showWallet, setShowWallet] = useState(false);

  // Fetch gate data from API
  useEffect(() => {
    const fetchGateData = async () => {
      try {
        const response = await api.get(`/org/klyrogates/${slug}`);
        
        if (response.data.success) {
          setGateData(response.data.data);
        } else {
          setError(response.data.error || 'Failed to load gate data');
        }
      } catch (err) {
        console.error('Error fetching gate data:', err);
        setError('Failed to load gate data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGateData();
  }, [slug]);

  // Check AIR login status on load
  useEffect(() => {
    const checkAirStatus = async () => {
      try {
        console.log('🔍 KlyroGate: Checking AIR session...');
        const hasSession = await klyroAirService.checkExistingSession();
        
        if (hasSession) {
          try {
            const userInfo = await klyroAirService.getUserInfo();
            setAirUserInfo(userInfo);
            console.log('👤 KlyroGate: Loaded AIR user info:', userInfo);
          } catch (userInfoError) {
            console.warn('⚠️ KlyroGate: Could not get user info despite valid session:', userInfoError);
          }
        } else {
          console.log('ℹ️ KlyroGate: No AIR session found');
          setAirUserInfo(null);
        }
      } catch (error) {
        console.error('❌ KlyroGate: Error checking AIR status:', error);
        setAirUserInfo(null);
      }
    };

    checkAirStatus();
  }, []);

  const handleAirLogout = async () => {
    try {
      await klyroAirService.logout();
      setAirUserInfo(null);
      console.log('✅ AIR logout successful');
    } catch (error) {
      console.error('❌ AIR logout failed:', error);
    }
  };

  const handleOpenWallet = async () => {
    try {
      console.log('🔗 Opening AIR wallet...');
      await klyroAirService.preloadWallet();
      const provider = await klyroAirService.getWalletProvider();
      console.log('✅ Wallet provider ready:', !!provider);
      setShowWallet(true);
      
      // You can integrate with web3 libraries here
      // Example: const web3 = new Web3(provider);
      
    } catch (error) {
      console.error('❌ Failed to open wallet:', error);
    }
  };

  const handleVerify = async () => {
    if (!gateData) return;
    
    if (!klyroAirService.isConfigured()) {
      console.error('AIR credentials not configured');
      setVerificationStatus('config-error');
      return;
    }
    
    setIsVerifying(true);
    
    try {
      // Use the first requirement's programId for verification, or default program
      const programId = gateData.credentialRequirements.length > 0 
        ? gateData.credentialRequirements[0].programId 
        : process.env.NEXT_PUBLIC_AIR_PROGRAM_ID || "prog_default_123";
        
      console.log('🚀 Starting verification for gate:', gateData.slug, 'with programId:', programId);
        
      await klyroAirService.verifyCredential(
        programId,
        // On successful verification
        async (result: any) => {
          console.log('✅ Credential verification successful:', result);
          
          try {
            // Get AIR user info to store with verification
            let airUserInfo = null;
            try {
              airUserInfo = await klyroAirService.getUserInfo();
              console.log('👤 AIR User Info Retrieved:', airUserInfo);
            } catch (userInfoError) {
              console.warn('⚠️ Could not get AIR user info:', userInfoError);
            }
            
            // Call backend to store verification result with user info
            const verificationResponse = await api.post(`/org/klyrogates/${slug}/verify`, {
              verificationResult: result,
              status: 'verified',
              credentialData: result,
              userInfo: airUserInfo
            });
            
            console.log('✅ Verification stored in backend:', verificationResponse.data);
            
            setVerificationStatus('verified');
            setIsVerifying(false);
            
            // Handle post-verification action
            if (gateData.actionType === 'redirect' && gateData.actionUrl) {
              setTimeout(() => {
                window.location.href = gateData.actionUrl;
              }, 3000);
            } else if (gateData.actionType === 'api_call') {
              console.log('✅ API webhook will be called by backend for:', gateData.actionUrl);
            }
          } catch (backendError) {
            console.error('❌ Failed to store verification in backend:', backendError);
            // Still show success to user since verification itself worked
            setVerificationStatus('verified');
            setIsVerifying(false);
          }
        },
        // On verification error
        async (error: any) => {
          console.error('❌ Credential verification failed:', error);
          
          try {
            // Store failed verification attempt
            await api.post(`/org/klyrogates/${slug}/verify`, {
              verificationResult: null,
              status: 'failed',
              error: error.message || 'Verification failed'
            });
          } catch (backendError) {
            console.error('❌ Failed to store failed verification:', backendError);
          }
          
          setVerificationStatus('failed');
          setIsVerifying(false);
        },
        // On non-compliant credentials (user has credentials but they don't meet requirements)
        async () => {
          console.log('⚠️ User credentials are non-compliant with requirements');
          
          try {
            // Store non-compliant attempt
            await api.post(`/org/klyrogates/${slug}/verify`, {
              verificationResult: null,
              status: 'non-compliant',
              error: 'User credentials do not meet verification requirements'
            });
          } catch (backendError) {
            console.error('❌ Failed to store non-compliant verification:', backendError);
          }
          
          setVerificationStatus('non-compliant');
          setIsVerifying(false);
        },
        // On credentials not found (user needs to create profile)
        async () => {
          console.log('🔍 User credentials not found, redirecting to profile creation');
          
          try {
            // Store not-found attempt
            await api.post(`/org/klyrogates/${slug}/verify`, {
              verificationResult: null,
              status: 'not-found',
              error: 'User credentials not found'
            });
          } catch (backendError) {
            console.error('❌ Failed to store not-found verification:', backendError);
          }
          
          setVerificationStatus('not-found');
          setIsVerifying(false);
          
          // Redirect to profile creation page
          setTimeout(() => {
            router.push('/create');
          }, 2000);
        }
      );
    } catch (error) {
      console.error('❌ Error launching credential verification:', error);
      setVerificationStatus('failed');
      setIsVerifying(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-zinc-400" />
          <p className="text-zinc-400">Loading verification gate...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !gateData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-400" />
          <p className="text-red-400 mb-2">Verification Gate Not Found</p>
          <p className="text-zinc-400 mb-4">{error || 'The requested verification gate does not exist or is no longer active.'}</p>
          <p className="text-xs text-zinc-500 mt-8">
            If you believe this is an error, please contact the organization that shared this link.
          </p>
        </div>
      </div>
    );
  }

  // Get organization colors
  const primaryColor = gateData.primaryColor || '#6366f1';
  const rgbColor = hexToRgb(primaryColor);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Organization Banner */}
      {gateData.bannerUrl && (
        <div className="relative h-32 md:h-48 overflow-hidden">
          <img 
            src={gateData.bannerUrl} 
            alt={`${gateData.organization.name} banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
      )}
      
      {/* Header */}
      <header className="border-b border-zinc-800" style={{ backgroundColor: `rgba(${rgbColor?.r || 99}, ${rgbColor?.g || 102}, ${rgbColor?.b || 241}, 0.1)` }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {gateData.organization.logoUrl ? (
                <img 
                  src={gateData.organization.logoUrl} 
                  alt={`${gateData.organization.name} logo`}
                  className="h-12 w-12 rounded-lg object-contain bg-white/10 p-2"
                />
              ) : (
                <div 
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  {gateData.organization.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{gateData.organization.name}</h1>
                {gateData.organization.description && (
                  <p className="text-sm text-zinc-400">{gateData.organization.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {airUserInfo && (
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleOpenWallet}
                    variant="outline"
                    size="sm"
                    className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                  >
                    <Wallet className="h-4 w-4 mr-1" />
                    Wallet
                  </Button>
                  <Button
                    onClick={handleAirLogout}
                    variant="outline"
                    size="sm"
                    className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                </div>
              )}
              
              {gateData.organization.website && (
                <a 
                  href={gateData.organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>
            {gateData.name}
          </h1>
          
          {/* Custom Message or Description */}
          {gateData.customMessage ? (
            <div className="bg-zinc-900 border-l-4 p-6 rounded-r-lg mt-6" style={{ borderLeftColor: primaryColor }}>
              <p className="text-zinc-200 text-lg leading-relaxed">
                {gateData.customMessage}
              </p>
            </div>
          ) : (
            <p className="text-zinc-300 text-lg mt-4">
              {gateData.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" style={{ color: primaryColor }} />
                  Verification Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {gateData.credentialRequirements.length > 0 ? (
                  gateData.credentialRequirements.map((requirement, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                                              <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: verificationStatus === 'verified' ? `${primaryColor}20` : 'rgba(113, 113, 122, 0.4)' }}
                      >
                        {verificationStatus === 'verified' ? 
                          <Check className="h-4 w-4" style={{ color: primaryColor }} /> : 
                          <div className="w-3 h-3 bg-zinc-500 rounded-full"></div>
                        }
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {CREDENTIAL_TYPE_LABELS[requirement.credentialType] || requirement.credentialType}
                          </h4>
                          <p className="text-sm text-zinc-400">
                            {requirement.minValue && `Minimum: ${requirement.minValue}`}
                            {requirement.stringValue && `Value: ${requirement.stringValue}`}
                            {requirement.isRequired && ' (Required)'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-zinc-800 rounded-lg text-center">
                    <p className="text-zinc-400">No specific requirements defined.</p>
                    <p className="text-sm text-zinc-500 mt-1">Basic credential verification required.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-zinc-900 border-zinc-800 sticky top-4">
              <CardHeader>
                <CardTitle className="text-center">
                  {verificationStatus === null ? 'Verify Credentials' : 
                   verificationStatus === 'verified' ? 'Verification Complete' : 'Status'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {verificationStatus === null ? (
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-zinc-800 rounded-lg border" style={{ borderColor: `${primaryColor}40` }}>
                      <Shield className="h-8 w-8 mx-auto mb-2" style={{ color: primaryColor }} />
                      <p className="text-sm text-zinc-400">
                        Verify your developer credentials to access {gateData.organization.name}
                      </p>
                    </div>
                    <Button 
                      onClick={handleVerify}
                      disabled={isVerifying}
                      className="w-full text-white font-medium"
                      style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${primaryColor}dd`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = primaryColor;
                      }}
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Verifying...
                        </>
                      ) : (
                        "Verify Credentials"
                      )}
                    </Button>
                  </div>
                ) : verificationStatus === 'verified' ? (
                  <div className="text-center space-y-4">
                    <div className="p-4 rounded-lg border" style={{ backgroundColor: `${primaryColor}20`, borderColor: primaryColor }}>
                      <Check className="h-8 w-8 mx-auto mb-2" style={{ color: primaryColor }} />
                      <p className="font-medium" style={{ color: primaryColor }}>Verification Successful!</p>
                      <p className="text-sm text-zinc-300 mt-2">
                        Welcome to {gateData.organization.name}!
                      </p>
                      {gateData.successMessage && (
                        <p className="text-sm text-zinc-300 mt-2">{gateData.successMessage}</p>
                      )}
                      {gateData.actionType === 'redirect' && (
                        <div className="flex items-center justify-center mt-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderBottomColor: primaryColor }}></div>
                          <span className="text-sm text-zinc-400">Redirecting...</span>
                        </div>
                      )}
                      {gateData.actionType === 'api_call' && (
                        <div className="flex items-center justify-center mt-3">
                          <Check className="h-4 w-4 mr-2" style={{ color: primaryColor }} />
                          <span className="text-sm text-zinc-400">Access granted!</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : verificationStatus === 'non-compliant' ? (
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                      <AlertCircle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                      <p className="text-yellow-400 font-medium">Verification Requirements Not Met</p>
                      <p className="text-sm text-zinc-300 mt-2">
                        You don't possess the required credential values to pass the verification for this gate.
                      </p>
                      <div className="space-y-3 mt-4">
                        <p className="text-xs text-zinc-400">
                          Please check your developer profile and ensure you meet the minimum requirements listed above.
                        </p>
                        <Button 
                          onClick={handleVerify}
                          variant="outline"
                          className="w-full border-yellow-600 text-yellow-400 hover:bg-yellow-950/30"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : verificationStatus === 'not-found' ? (
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                      <User className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-blue-400 font-medium">Create Your Developer Profile</p>
                      <p className="text-sm text-zinc-300 mt-2">
                        No verifiable credentials found. Create your developer profile to get started.
                      </p>
                      <div className="space-y-3 mt-4">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                          <span className="text-sm text-zinc-400">Redirecting to profile creation...</span>
                        </div>
                        <Button 
                          onClick={() => router.push('/create')}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Create Profile Now
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : verificationStatus === 'failed' ? (
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                      <X className="h-8 w-8 text-red-400 mx-auto mb-2" />
                      <p className="text-red-400 font-medium">Verification Failed</p>
                      <p className="text-sm text-zinc-300 mt-2">
                        Please try again or contact support
                      </p>
                    </div>
                    <Button 
                      onClick={handleVerify}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : verificationStatus === 'config-error' || verificationStatus === 'service-error' ? (
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                      <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                      <p className="text-red-400 font-medium">Service Unavailable</p>
                      <p className="text-sm text-zinc-300 mt-2">
                        AIR credential service is not configured
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-zinc-800 rounded-lg text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Connected as:</span>
                        <span className="font-medium">@alexdev</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-zinc-400">Developer Score:</span>
                        <span className="font-medium text-green-400">8.5</span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleVerify}
                      disabled={isVerifying}
                      className="w-full text-white font-medium"
                      style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${primaryColor}dd`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = primaryColor;
                      }}
                    >
                      {isVerifying ? "Verifying..." : "Verify Credentials"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-zinc-800 py-4 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-zinc-500">
            Secure credential verification powered by{" "}
            <a 
              href="https://klyro.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-zinc-400 transition-colors"
            >
              Klyro
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
} 