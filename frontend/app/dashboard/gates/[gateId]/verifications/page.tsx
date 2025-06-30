"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, Search, Shield, User, Calendar, FileText, Copy, CheckCheck, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/axiosClient";

interface Verification {
  id: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  verifiedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  credentialResults: any;
  user: {
    id: string;
    githubId?: string;
    airUserId?: string;
    airDid?: string;
    email: string;
    githubData?: {
      userInfo?: {
        login: string;
        name?: string;
      };
    };

    wallets: Array<{
      address: string;
      network: string;
    }>;
  };
  klyroGate?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    organization: {
      id: string;
      name: string;
    };
  };
}

interface KlyroGate {
  id: string;
  name: string;
  slug: string;
  description: string;
  organization: {
    name: string;
  };
}

export default function VerificationsPage() {
  const params = useParams();
  const gateId = params.gateId as string;

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [gateData, setGateData] = useState<KlyroGate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Fetch verifications from API (includes gate information)
  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/org/gates/${gateId}/verifications`);
        
        if (response.data.success) {
          const verificationsData = response.data.data;
          setVerifications(verificationsData);
          
          // Extract gate information from the first verification (if available)
          if (verificationsData.length > 0 && verificationsData[0].klyroGate) {
            setGateData(verificationsData[0].klyroGate);
            console.log('✅ Loaded gate data from verification:', verificationsData[0].klyroGate);
          } else if (verificationsData.length === 0) {
            // If no verifications exist, we can't get gate info from them
            // For now, just show a generic title - the partner knows which gate they clicked on
            console.log('ℹ️ No verifications found, gate information unavailable');
          }
          
          console.log('✅ Loaded verifications:', verificationsData);
        } else {
          setError(response.data.error || 'Failed to load verifications');
        }
      } catch (err) {
        console.error('❌ Error fetching verifications:', err);
        setError('Failed to load verifications');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerifications();
  }, [gateId]);

  // Helper functions to extract data from verification
  const getUserName = (verification: Verification) => {
    // Try to get name from GitHub data first, then fallback to AIR email or IDs
    const githubName = verification.user.githubData?.userInfo?.name;
    const githubId = verification.user.githubId;
    const airUserId = verification.user.airUserId;
    const userEmail = verification.user.email;
    
    // Use email username part if available, otherwise use IDs
    if (githubName) return githubName;
    if (userEmail && userEmail.includes('@')) {
      return userEmail.split('@')[0]; // Use part before @ as display name
    }
    if (airUserId) return `AIR User ${airUserId.slice(0, 8)}`;
    if (githubId) return githubId;
    return `User ${verification.user.id.slice(0, 8)}`;
  };

  const getGithubUsername = (verification: Verification) => {
    // Return GitHub username or indicate if it's an AIR-only user
    const githubLogin = verification.user.githubData?.userInfo?.login;
    const githubId = verification.user.githubId;
    const airUserId = verification.user.airUserId;
    const userEmail = verification.user.email;
    
    if (githubLogin) return githubLogin;
    if (githubId) return githubId;
    if (airUserId) return `AIR:${airUserId.slice(0, 12)}...`;
    if (userEmail) return userEmail;
    return 'No GitHub';
  };

  const getWalletAddress = (verification: Verification) => {
    // Prioritize AIR DID (abstractAccountAddress), then other wallets
    const airDid = verification.user.airDid; // This should be the abstractAccountAddress
    const airWallet = verification.user.wallets?.find(w => w.network === 'AIR_DID');
    const otherWallet = verification.user.wallets?.find(w => w.network !== 'AIR_DID');
    
    return airDid || airWallet?.address || otherWallet?.address || 'No wallet';
  };



  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'VERIFIED': return 'verified';
      case 'PENDING': return 'pending';
      case 'REJECTED': return 'rejected';
      case 'EXPIRED': return 'expired';
      default: return status.toLowerCase();
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'VERIFIED':
        return <Badge className="bg-green-900/40 text-green-400">Verified</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-900/40 text-yellow-400">Pending</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-900/40 text-red-400">Rejected</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-gray-900/40 text-gray-400">Expired</Badge>;
      default:
        return <Badge className="bg-zinc-900/40 text-zinc-400">{status}</Badge>;
    }
  };

  // Filter verifications
  const filteredVerifications = verifications.filter(verification => {
    const userName = getUserName(verification);
    const githubUsername = getGithubUsername(verification);
    const walletAddress = getWalletAddress(verification);
    
    const matchesSearch = searchTerm === "" || 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      githubUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      walletAddress.toLowerCase().includes(searchTerm.toLowerCase());
    
    const statusDisplay = getStatusDisplay(verification.status);
    const matchesStatus = statusFilter === "all" || statusDisplay === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Download functions
  const downloadCSV = () => {
    const headers = ["Name", "Username", "Address/DID", "Email", "Verified At", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredVerifications.map(verification => [
        `"${getUserName(verification)}"`,
        getGithubUsername(verification),
        getWalletAddress(verification),
        verification.user.email || '',
        verification.verifiedAt || verification.createdAt,
        getStatusDisplay(verification.status)
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `gate-${gateId}-verifications.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = () => {
    const jsonData = {
      gate_id: gateId,
      gate_name: gateData?.name || "KlyroGate Verifications",
      exported_at: new Date().toISOString(),
      total_verifications: filteredVerifications.length,
              verifications: filteredVerifications.map(v => ({
          name: getUserName(v),
          github_username: getGithubUsername(v),
          wallet_address: getWalletAddress(v),
          verified_at: v.verifiedAt || v.createdAt,
          status: getStatusDisplay(v.status),
          user_id: v.user.id,
          air_user_id: v.user.airUserId,
          air_abstract_account_address: v.user.airDid, // This is the abstractAccountAddress
          email: v.user.email,
          github_id: v.user.githubId,
          credential_results: v.credentialResults
        }))
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `gate-${gateId}-verifications.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatAddress = (address: string) => {
    if (address === 'No wallet') return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-zinc-400" />
          <p className="text-zinc-400">Loading verifications...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-400" />
          <p className="text-red-400 mb-2">Failed to Load Verifications</p>
          <p className="text-zinc-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 py-4">
        <div className="container mx-auto px-4 flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl font-bold">Verified Developers</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              {gateData?.name || "Verifications"}
            </h2>
            {gateData?.organization && (
              <p className="text-sm text-zinc-500 mb-1">
                {gateData.organization.name}
              </p>
            )}
            <p className="text-zinc-400">{filteredVerifications.length} total verifications</p>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={downloadCSV} variant="outline" className="border-zinc-700">
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button onClick={downloadJSON} className="bg-indigo-600 hover:bg-indigo-700">
              <FileText className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Search by name, GitHub username, or wallet address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verifications Table */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Verifications ({filteredVerifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left p-4 text-sm font-medium text-zinc-400">Developer</th>
                    <th className="text-left p-4 text-sm font-medium text-zinc-400 hidden md:table-cell">Address/DID</th>
                    <th className="text-left p-4 text-sm font-medium text-zinc-400 hidden lg:table-cell">Verified At</th>
                    <th className="text-left p-4 text-sm font-medium text-zinc-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVerifications.map((verification) => (
                    <tr key={verification.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{getUserName(verification)}</div>
                          <div className="text-sm text-zinc-400">@{getGithubUsername(verification)}</div>
                          <div className="text-xs text-zinc-500">
                            ID: {verification.user.airUserId || verification.user.githubId || verification.user.id.slice(0, 8)}
                          </div>
                          {verification.user.airDid && (
                            <div className="text-xs text-zinc-500">
                              Address: {verification.user.airDid.slice(0, 6)}...{verification.user.airDid.slice(-4)}
                            </div>
                          )}
                          {verification.user.email && (
                            <div className="text-xs text-zinc-500">Email: {verification.user.email}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="flex items-center space-x-2">
                          <div className="font-mono text-sm text-zinc-300">
                            {formatAddress(getWalletAddress(verification))}
                          </div>
                          {getWalletAddress(verification) !== 'No wallet' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(getWalletAddress(verification))}
                              className="h-6 w-6 p-0 hover:bg-zinc-700"
                              title="Copy full address"
                            >
                              {copiedAddress === getWalletAddress(verification) ? (
                                <CheckCheck className="h-3 w-3 text-green-400" />
                              ) : (
                                <Copy className="h-3 w-3 text-zinc-400" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-zinc-300 hidden lg:table-cell">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-zinc-500" />
                          {formatDate(verification.verifiedAt || verification.createdAt)}
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(verification.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredVerifications.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No verifications found</h3>
                <p className="text-zinc-400">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filters"
                    : verifications.length === 0 
                      ? "No developers have completed verification for this gate yet"
                      : "No verifications match your current filters"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {filteredVerifications.length > 0 && (
          <div className="grid grid-cols-1 gap-4 mt-6 max-w-md">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Recent Verifications</p>
                    <p className="text-2xl font-bold text-indigo-400">
                      {filteredVerifications.filter(v => 
                        new Date(v.verifiedAt || v.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                      ).length}
                    </p>
                    <p className="text-xs text-zinc-500">Last 24 hours</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-900/40 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-indigo-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
} 