"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, X, Shield, Palette, Settings, Save, ExternalLink, Zap } from "lucide-react";
import { api } from "@/lib/axiosClient";

// Credential requirement interface (will be fetched from backend)
interface CredentialType {
  id: string;
  label: string;
  description: string;
  programId: string;
  type: 'number' | 'boolean' | 'string';
  isActive: boolean;
}

interface CredentialRequirement {
  id: string;
  credentialType: string;
  programId: string;
  minValue?: number;
  maxValue?: number;
  stringValue?: string;
  isRequired: boolean;
}

export default function CreateKlyroGate() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableCredentialTypes, setAvailableCredentialTypes] = useState<CredentialType[]>([]);
  const [loadingCredentialTypes, setLoadingCredentialTypes] = useState(true);
  const [partner, setPartner] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    primaryColor: "#6366f1",
    customMessage: "",
    isActive: true,
    allowSelfVerify: true,
    requiresApproval: false,
    maxVerifications: "",
    expiresAt: "",
    bannerUrl: "",
    // Post-verification action
    actionType: "", // "redirect" | "api_call" | "none"
    actionUrl: "",
    actionMethod: "POST", // For API calls
    actionHeaders: "",
    actionPayload: "",
    successMessage: ""
  });

  const [credentialRequirements, setCredentialRequirements] = useState<CredentialRequirement[]>([]);

  // Check authentication and load data
  useEffect(() => {
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
        setOrganizations(partnerData.organizations || []);
        
        // Auto-select first organization if available
        if (partnerData.organizations && partnerData.organizations.length > 0) {
          setSelectedOrganizationId(partnerData.organizations[0].id);
        }
      } catch (error) {
        console.error('Error loading partner data:', error);
        router.push('/partner-login');
      }
    };

    checkAuthAndLoadData();
  }, [router]);

  // Fetch available credential requirements
  useEffect(() => {
    const fetchCredentialTypes = async () => {
      try {
        const response = await api.get('/org/credential-requirements');
        
        if (response.data.success) {
          setAvailableCredentialTypes(response.data.data);
        } else {
          console.error('Failed to fetch credential types:', response.data.error);
        }
      } catch (error) {
        console.error('Error fetching credential types:', error);
      } finally {
        setLoadingCredentialTypes(false);
      }
    };

    fetchCredentialTypes();
  }, []);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    setFormData(prev => ({ ...prev, name, slug }));
  };

  // Add credential requirement
  const addCredentialRequirement = (credentialType: string) => {
    const credentialTypeInfo = availableCredentialTypes.find(type => type.id === credentialType);
    if (!credentialTypeInfo) return;
    
    const newRequirement: CredentialRequirement = {
      id: Math.random().toString(36).substr(2, 9),
      credentialType,
      programId: credentialTypeInfo.programId,
      isRequired: true
    };
    
    setCredentialRequirements(prev => [...prev, newRequirement]);
  };

  // Remove credential requirement
  const removeCredentialRequirement = (id: string) => {
    setCredentialRequirements(prev => prev.filter(req => req.id !== id));
  };

  // Update credential requirement
  const updateCredentialRequirement = (id: string, updates: Partial<CredentialRequirement>) => {
    setCredentialRequirements(prev => 
      prev.map(req => req.id === id ? { ...req, ...updates } : req)
    );
  };

  // Get credential type info
  const getCredentialTypeInfo = (credentialType: string) => {
    return availableCredentialTypes.find((type: CredentialType) => type.id === credentialType);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrganizationId) {
      alert('Please select an organization');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const requestData = {
        ...formData,
        maxVerifications: formData.maxVerifications ? parseInt(formData.maxVerifications) : null,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        // Include action fields
        actionType: formData.actionType || 'none',
        actionUrl: formData.actionUrl || null,
        actionMethod: formData.actionMethod || 'POST',
        actionHeaders: formData.actionHeaders || null,
        actionPayload: formData.actionPayload || null,
        successMessage: formData.successMessage || null,
        // Use selected organization ID
        organizationId: selectedOrganizationId,
        credentialRequirements: credentialRequirements.map(req => ({
          credentialType: req.credentialType,
          programId: req.programId,
          minValue: req.minValue,
          maxValue: req.maxValue,
          stringValue: req.stringValue,
          isRequired: req.isRequired
        }))
      };

      console.log("Creating KlyroGate:", requestData);
      
      // Call the backend API
      const response = await api.post('/org/klyrogates', requestData);
      
      if (response.data.success) {
        console.log("KlyroGate created successfully:", response.data.data);
        
        // Clear localStorage to force fresh data fetch on dashboard
        const savedPartner = localStorage.getItem('partner');
        if (savedPartner) {
          const partnerData = JSON.parse(savedPartner);
          // Remove organizations to force fresh fetch
          delete partnerData.organizations;
          localStorage.setItem('partner', JSON.stringify(partnerData));
        }
        
        router.push("/dashboard");
      } else {
        console.error("Failed to create KlyroGate:", response.data.error);
        alert("Failed to create KlyroGate: " + response.data.error);
      }
    } catch (error) {
      console.error("Error creating KlyroGate:", error);
      alert("Error creating KlyroGate: " + error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h1 className="text-xl font-bold">Create KlyroGate</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Organization Selection */}
              <div>
                <Label htmlFor="organization">Organization *</Label>
                <Select 
                  value={selectedOrganizationId} 
                  onValueChange={setSelectedOrganizationId}
                  required
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select an organization" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {organizations.length === 0 && (
                  <p className="text-sm text-red-400 mt-1">
                    You need to have an organization to create a KlyroGate
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Gate Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., ETH Global Cannes"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <div className="flex items-center">
                    <span className="text-sm text-zinc-400 mr-2">klyro.dev/gate/</span>
                    <Input
                      id="slug"
                      placeholder="eth-global-cannes"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                      required
                    />
                  </div>
                </div>
              </div>



              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this verification gate is for..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="customMessage">Custom Welcome Message</Label>
                <Textarea
                  id="customMessage"
                  placeholder="Welcome to ETH Global Cannes! 🇫🇷 We're looking for talented developers to join our hackathon. Verify your credentials below to secure your spot."
                  value={formData.customMessage}
                  onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-10 rounded border border-zinc-700 bg-zinc-800"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bannerUrl">Banner Image URL</Label>
                  <Input
                    id="bannerUrl"
                    placeholder="https://example.com/banner.jpg"
                    value={formData.bannerUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, bannerUrl: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credential Requirements */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Credential Requirements
              </CardTitle>
              <p className="text-sm text-zinc-400">
                Define which credentials users need to verify for this gate
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current requirements */}
              {credentialRequirements.map((requirement) => {
                const typeInfo = getCredentialTypeInfo(requirement.credentialType);
                return (
                  <div key={requirement.id} className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{typeInfo?.label}</h4>
                        <p className="text-sm text-zinc-400">{typeInfo?.description}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCredentialRequirement(requirement.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={requirement.isRequired}
                          onCheckedChange={(checked) => 
                            updateCredentialRequirement(requirement.id, { isRequired: checked })
                          }
                        />
                        <Label className="text-sm">Required</Label>
                      </div>

                      {typeInfo?.type === 'number' && (
                        <div className="flex items-center space-x-2">
                          <Label className="text-sm">Min:</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={requirement.minValue || ''}
                            onChange={(e) => 
                              updateCredentialRequirement(requirement.id, { 
                                minValue: e.target.value ? parseInt(e.target.value) : undefined 
                              })
                            }
                            className="w-20 bg-zinc-700 border-zinc-600"
                          />
                        </div>
                      )}

                      {typeInfo?.type === 'string' && (
                        <div className="flex items-center space-x-2">
                          <Label className="text-sm">Value:</Label>
                          <Input
                            placeholder="Enter required value"
                            value={requirement.stringValue || ''}
                            onChange={(e) => 
                              updateCredentialRequirement(requirement.id, { stringValue: e.target.value })
                            }
                            className="bg-zinc-700 border-zinc-600"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add new requirement */}
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-4">
                <p className="text-sm text-zinc-400 mb-3">Add credential requirement:</p>
                {loadingCredentialTypes ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400 mx-auto"></div>
                    <p className="text-sm text-zinc-400 mt-2">Loading credential types...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {availableCredentialTypes
                      .filter((type: CredentialType) => !credentialRequirements.some(req => req.credentialType === type.id))
                      .map((type: CredentialType) => (
                        <Button
                          key={type.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addCredentialRequirement(type.id)}
                          className="justify-start border-zinc-700 hover:bg-zinc-800"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {type.label}
                        </Button>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Active</Label>
                      <p className="text-sm text-zinc-400">Gate is active and accepting verifications</p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Self Verification</Label>
                      <p className="text-sm text-zinc-400">Users can verify themselves automatically</p>
                    </div>
                    <Switch
                      checked={formData.allowSelfVerify}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowSelfVerify: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Manual Approval</Label>
                      <p className="text-sm text-zinc-400">Verifications need manual approval</p>
                    </div>
                    <Switch
                      checked={formData.requiresApproval}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresApproval: checked }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="maxVerifications">Maximum Verifications</Label>
                    <Input
                      id="maxVerifications"
                      type="number"
                      placeholder="No limit"
                      value={formData.maxVerifications}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxVerifications: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  <div>
                    <Label htmlFor="expiresAt">Expiry Date</Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Post-Verification Actions */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Post-Verification Actions
              </CardTitle>
              <p className="text-sm text-zinc-400">
                Configure what happens after a user successfully verifies their credentials
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="actionType">Action Type</Label>
                <Select 
                  value={formData.actionType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, actionType: value }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select what happens after verification" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="none">No Action</SelectItem>
                    <SelectItem value="redirect">Redirect to Website</SelectItem>
                    <SelectItem value="api_call">Call API Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.actionType === "redirect" && (
                <div className="space-y-4 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <ExternalLink className="h-4 w-4 text-indigo-400" />
                    <h4 className="font-medium">Website Redirect</h4>
                  </div>
                  <div>
                    <Label htmlFor="actionUrl">Redirect URL *</Label>
                    <Input
                      id="actionUrl"
                      placeholder="https://ethglobal.com or https://mocaverse.xyz"
                      value={formData.actionUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, actionUrl: e.target.value }))}
                      className="bg-zinc-700 border-zinc-600"
                    />
                    <p className="text-xs text-zinc-400 mt-1">
                      Users will be redirected here after successful verification
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="successMessage">Success Message</Label>
                    <Input
                      id="successMessage"
                      placeholder="Welcome to ETH Global Cannes! Redirecting..."
                      value={formData.successMessage}
                      onChange={(e) => setFormData(prev => ({ ...prev, successMessage: e.target.value }))}
                      className="bg-zinc-700 border-zinc-600"
                    />
                  </div>
                </div>
              )}

              {formData.actionType === "api_call" && (
                <div className="space-y-4 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-4 w-4 text-indigo-400" />
                    <h4 className="font-medium">API Webhook</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                      <Label htmlFor="actionMethod">Method</Label>
                      <Select 
                        value={formData.actionMethod} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, actionMethod: value }))}
                      >
                        <SelectTrigger className="bg-zinc-700 border-zinc-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-700 border-zinc-600">
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-3">
                      <Label htmlFor="actionUrl">API Endpoint *</Label>
                      <Input
                        id="actionUrl"
                        placeholder="https://api.ethglobal.com/webhook/verified"
                        value={formData.actionUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, actionUrl: e.target.value }))}
                        className="bg-zinc-700 border-zinc-600"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="actionHeaders">Headers (JSON)</Label>
                    <Textarea
                      id="actionHeaders"
                      placeholder='{"Authorization": "Bearer your-api-key", "Content-Type": "application/json", "X-Event-Source": "klyro"}'
                      value={formData.actionHeaders}
                      onChange={(e) => setFormData(prev => ({ ...prev, actionHeaders: e.target.value }))}
                      className="bg-zinc-700 border-zinc-600 font-mono text-sm"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="actionPayload">Payload Template (JSON)</Label>
                    <Textarea
                      id="actionPayload"
                      placeholder='{"user_id": "{{userId}}", "github": "{{githubUsername}}", "score": "{{developerScore}}", "event": "{{gateName}}", "timestamp": "{{timestamp}}"}'
                      value={formData.actionPayload}
                      onChange={(e) => setFormData(prev => ({ ...prev, actionPayload: e.target.value }))}
                      className="bg-zinc-700 border-zinc-600 font-mono text-sm"
                      rows={3}
                    />
                    <p className="text-xs text-zinc-400 mt-1">
                      Available templates: {"{userId}"}, {"{githubUsername}"}, {"{developerScore}"}, {"{gateName}"}, {"{gateSlug}"}, {"{verificationId}"}, {"{timestamp}"}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="successMessage">Success Message</Label>
                    <Input
                      id="successMessage"
                      placeholder="Welcome to the Moca ecosystem! Check your email for next steps."
                      value={formData.successMessage}
                      onChange={(e) => setFormData(prev => ({ ...prev, successMessage: e.target.value }))}
                      className="bg-zinc-700 border-zinc-600"
                    />
                  </div>
                </div>
              )}

              {formData.actionType === "none" && (
                <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                  <p className="text-sm text-zinc-400">
                    No action will be taken after verification. Users will see a success message only.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Link href="/dashboard">
              <Button variant="outline" className="border-zinc-700">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create KlyroGate
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
} 