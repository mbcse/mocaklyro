"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { klyroAirService } from "@/lib/airService";
import { AlertCircle, CheckCircle, Info, RefreshCw } from "lucide-react";

export default function AirDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    setIsLoading(true);
    try {
      console.log('🔧 Running AIR debug...');
      
      // Debug environment
      klyroAirService.debugAirEnvironment();
      
      // Check configuration
      const isConfigured = klyroAirService.isConfigured();
      
      // Check existing session
      const hasSession = await klyroAirService.checkExistingSession();
      
      // Get login status
      const loginStatus = klyroAirService.getLoginStatus();
      
      let userInfo = null;
      if (hasSession && loginStatus) {
        try {
          userInfo = await klyroAirService.getUserInfo();
        } catch (error) {
          console.warn('Could not get user info:', error);
        }
      }

      const debugData = {
        isConfigured,
        hasSession,
        loginStatus,
        userInfo,
        environment: {
          PARTNER_ID: process.env.NEXT_PUBLIC_AIR_PARTNER_ID ? 'SET' : 'NOT SET',
          ISSUER_DID: process.env.NEXT_PUBLIC_AIR_ISSUER_DID ? 'SET' : 'NOT SET',
          ISSUER_API_KEY: process.env.NEXT_PUBLIC_AIR_ISSUER_API_KEY ? 'SET' : 'NOT SET',
          VERIFIER_DID: process.env.NEXT_PUBLIC_AIR_VERIFIER_DID ? 'SET' : 'NOT SET',
          VERIFIER_API_KEY: process.env.NEXT_PUBLIC_AIR_VERIFIER_API_KEY ? 'SET' : 'NOT SET',
          CREDENTIAL_ID: process.env.NEXT_PUBLIC_AIR_CREDENTIAL_ID ? 'SET' : 'NOT SET',
          PROGRAM_ID: process.env.NEXT_PUBLIC_AIR_PROGRAM_ID ? 'SET' : 'NOT SET',
        }
      };

      setDebugInfo(debugData);
      console.log('🔧 Debug results:', debugData);
    } catch (error) {
      console.error('❌ Debug failed:', error);
      setDebugInfo({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    try {
      console.log('🚀 Testing AIR login...');
      await klyroAirService.initialize();
      await runDebug(); // Refresh debug info
    } catch (error) {
      console.error('❌ Test login failed:', error);
    }
  };

  const testLogout = async () => {
    try {
      console.log('🚪 Testing AIR logout...');
      await klyroAirService.logout();
      await runDebug(); // Refresh debug info
    } catch (error) {
      console.error('❌ Test logout failed:', error);
    }
  };

  const testRefreshState = async () => {
    try {
      console.log('🔄 Testing refresh state...');
      const state = await klyroAirService.refreshState();
      console.log('🔄 Refresh state result:', state);
      await runDebug(); // Refresh debug info
    } catch (error) {
      console.error('❌ Test refresh state failed:', error);
    }
  };

  useEffect(() => {
    runDebug();
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 text-sm"
        >
          <AlertCircle className="h-4 w-4 mr-1" />
          AIR Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="bg-zinc-900 border-zinc-700 text-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-yellow-400" />
              AIR Debug Panel
            </CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={runDebug}
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Refresh
            </Button>
            <Button
              onClick={testRefreshState}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              Test Refresh
            </Button>
            <Button
              onClick={testLogin}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Test Login
            </Button>
            <Button
              onClick={testLogout}
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              Test Logout
            </Button>
          </div>

          {debugInfo && (
            <div className="space-y-3 text-sm">
              {/* Configuration Status */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {debugInfo.isConfigured ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  )}
                  <span className="font-medium">Configuration</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs ml-6">
                  {Object.entries(debugInfo.environment).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-zinc-400">{key}:</span>
                      <Badge
                        className={`text-xs px-1 py-0 ${
                          value === 'SET' 
                            ? 'bg-green-900/40 text-green-400' 
                            : 'bg-red-900/40 text-red-400'
                        }`}
                      >
                        {value}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Status */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {debugInfo.hasSession ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Info className="h-4 w-4 text-zinc-400" />
                  )}
                  <span className="font-medium">Session Status</span>
                </div>
                <div className="ml-6 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Has Session:</span>
                    <Badge className={`text-xs px-1 py-0 ${debugInfo.hasSession ? 'bg-green-900/40 text-green-400' : 'bg-zinc-900/40 text-zinc-400'}`}>
                      {debugInfo.hasSession ? 'YES' : 'NO'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Login Status:</span>
                    <Badge className={`text-xs px-1 py-0 ${debugInfo.loginStatus ? 'bg-green-900/40 text-green-400' : 'bg-zinc-900/40 text-zinc-400'}`}>
                      {debugInfo.loginStatus ? 'LOGGED IN' : 'NOT LOGGED IN'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* User Info */}
              {debugInfo.userInfo && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="font-medium">User Info</span>
                  </div>
                  <div className="ml-6 space-y-1 text-xs">
                    <div><span className="text-zinc-400">Name:</span> {debugInfo.userInfo.name || 'N/A'}</div>
                    <div><span className="text-zinc-400">Username:</span> {debugInfo.userInfo.username || 'N/A'}</div>
                    <div><span className="text-zinc-400">User ID:</span> {debugInfo.userInfo.userId || debugInfo.userInfo.id || 'N/A'}</div>
                    <div><span className="text-zinc-400">DID:</span> {debugInfo.userInfo.did || debugInfo.userInfo.globalId || 'N/A'}</div>
                  </div>
                </div>
              )}

              {/* Error */}
              {debugInfo.error && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="font-medium">Error</span>
                  </div>
                  <div className="ml-6 text-xs text-red-400 bg-red-900/20 p-2 rounded">
                    {String(debugInfo.error)}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 