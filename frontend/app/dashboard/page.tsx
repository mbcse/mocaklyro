"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, ExternalLink, Users, Clock, CheckCircle, Eye, Loader2 } from "lucide-react";
import { api } from "@/lib/axiosClient";
import { env } from "@/config/env";

interface Partner {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface Organization {
  id: string;
  name: string;
  description?: string;
  website?: string;
  klyroGates: KlyroGate[];
}

interface KlyroGate {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  verifications: any[];
}

export default function Dashboard() {
  const router = useRouter();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const baseUrl = env.FRONTEND_URL;

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      // Check if partner is logged in
      const savedPartner = localStorage.getItem('partner');
      if (!savedPartner) {
        router.push('/partner-login');
        return;
      }

      const partnerData = JSON.parse(savedPartner);
      setPartner(partnerData.partner);

      // Always fetch fresh data from API to get latest KlyroGates
      console.log('Fetching fresh partner data from API...');
      const response = await api.get('/org/partner/profile');
      if (response.data.success) {
        console.log('Partner profile data:', response.data.data);
        setOrganizations(response.data.data.organizations || []);
        
        // Update localStorage with fresh data
        const updatedPartnerData = {
          ...partnerData,
          organizations: response.data.data.organizations || []
        };
        localStorage.setItem('partner', JSON.stringify(updatedPartnerData));
      } else {
        setError('Failed to load partner data');
      }
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
      if (err.response?.status === 401) {
        localStorage.removeItem('partner');
        router.push('/partner-login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('partner');
    router.push('/partner-login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={checkAuthAndLoadData}>Retry</Button>
        </div>
      </div>
    );
  }

  // Debug: Log organizations data
  console.log('Organizations data:', organizations);

  // Get all gates from all organizations
  const allGates = organizations.flatMap(org => {
    console.log(`Organization ${org.name} has ${org.klyroGates?.length || 0} gates:`, org.klyroGates);
    return org.klyroGates || [];
  });
  
  console.log('All gates:', allGates);
  
  const totalVerifications = allGates.reduce((sum, gate) => sum + (gate.verifications?.length || 0), 0);
  const activeGates = allGates.filter(gate => gate.isActive);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-indigo-400" />
              <div>
                <h1 className="text-2xl font-bold">Partner Dashboard</h1>
                <p className="text-zinc-400 text-sm">
                  Welcome back, {partner?.firstName || partner?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsLoading(true);
                  checkAuthAndLoadData();
                }}
                disabled={isLoading}
              >
                Refresh
              </Button>
              <Link href="/dashboard/create-gate">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create KlyroGate
                </Button>
              </Link>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-400">Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizations.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-400">Total Gates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allGates.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-400">Total Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVerifications}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-400">Active Gates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeGates.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Organizations and Gates */}
        <div className="space-y-8">
          {organizations.map((org) => (
            <div key={org.id}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{org.name}</h2>
                  {org.description && (
                    <p className="text-zinc-400 text-sm">{org.description}</p>
                  )}
                </div>
              </div>
              
              {!org.klyroGates || org.klyroGates.length === 0 ? (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="py-12 text-center">
                    <Shield className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No KlyroGates for {org.name}</h3>
                    <p className="text-zinc-400 mb-4">Create your first KlyroGate to start verifying developers</p>
                    <Link href="/dashboard/create-gate">
                      <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create KlyroGate
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {org.klyroGates.map((gate) => (
                    <Card key={gate.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold">{gate.name}</h3>
                              <Badge variant={gate.isActive ? "default" : "secondary"}>
                                {gate.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            
                            <p className="text-zinc-400 mb-4">{gate.description || 'No description'}</p>
                            
                            <div className="flex items-center space-x-6 text-sm text-zinc-400">
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>{gate.verifications?.length || 0} verifications</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>Created {new Date(gate.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <Link href={`/klyrogate/${gate.slug}`} target="_blank">
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            
                            <Link href={`/dashboard/gates/${gate.id}/verifications`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                Verifications
                              </Button>
                            </Link>
                          </div>
                        </div>
                        
                        {/* Share Link */}
                        <div className="mt-4 pt-4 border-t border-zinc-800">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={`${baseUrl}/klyrogate/${gate.slug}`}
                                readOnly
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-300"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(`${baseUrl}/klyrogate/${gate.slug}`);
                              }}
                            >
                              Copy Link
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {organizations.length === 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No organizations found</h3>
                <p className="text-zinc-400 mb-4">This shouldn't happen. Please contact support.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 