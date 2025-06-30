"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Mail, Lock, Building2, Loader2 } from "lucide-react";
import { api } from "@/lib/axiosClient";

export default function PartnerLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  // Signup form state
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
    website: "",
    description: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/org/partner/login', loginData);
      
      if (response.data.success) {
        // Store partner info in localStorage
        localStorage.setItem('partner', JSON.stringify(response.data.data));
        router.push('/dashboard');
      } else {
        setError(response.data.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/org/partner/signup', {
        email: signupData.email,
        password: signupData.password,
        organization: {
          name: signupData.organizationName,
          website: signupData.website,
          description: signupData.description
        }
      });
      
      if (response.data.success) {
        // Store partner info in localStorage
        localStorage.setItem('partner', JSON.stringify(response.data.data));
        router.push('/dashboard');
      } else {
        setError(response.data.error || 'Signup failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-indigo-400" />
            <span className="font-serif italic text-2xl">Klyro</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Partner Portal</h1>
          <p className="text-zinc-400">Create and manage your KlyroGates</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-800 border-zinc-700">
            <TabsTrigger value="login" className="data-[state=active]:bg-zinc-700">Login</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-zinc-700">Sign Up</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Partner Login
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                      required
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Create Partner Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-email">Email Address</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupData.password}
                      onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                      required
                    />
                  </div>

                  <div className="border-t border-zinc-700 pt-4">
                    <h3 className="font-medium mb-3">Organization Details</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="org-name">Organization Name *</Label>
                        <Input
                          id="org-name"
                          value={signupData.organizationName}
                          onChange={(e) => setSignupData(prev => ({ ...prev, organizationName: e.target.value }))}
                          className="bg-zinc-800 border-zinc-700"
                          placeholder="e.g., ETH Global, Moca Network"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="org-website">Website</Label>
                        <Input
                          id="org-website"
                          type="url"
                          value={signupData.website}
                          onChange={(e) => setSignupData(prev => ({ ...prev, website: e.target.value }))}
                          className="bg-zinc-800 border-zinc-700"
                          placeholder="https://ethglobal.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="org-description">Description</Label>
                        <Input
                          id="org-description"
                          value={signupData.description}
                          onChange={(e) => setSignupData(prev => ({ ...prev, description: e.target.value }))}
                          className="bg-zinc-800 border-zinc-700"
                          placeholder="Brief description of your organization"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-6">
          <Link href="/" className="text-zinc-400 hover:text-white text-sm">
            ← Back to Klyro
          </Link>
        </div>
      </div>
    </div>
  );
} 