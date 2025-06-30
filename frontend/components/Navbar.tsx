// components/Navbar.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { Github, User, Shield, LogOut, Wallet, UserCheck } from "lucide-react";
import { Button } from "./ui/button";
import { klyroAirService } from "@/lib/airService";

export default function Navbar() {
  const pathname = usePathname();
  
  // Double safety check: Don't render navbar on dashboard or partner pages
  if (pathname?.startsWith('/dashboard') || pathname === '/partner-login') {
    console.log('🚫 Navbar: Blocking render for dashboard/partner page:', pathname);
    return null;
  }
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [airUserInfo, setAirUserInfo] = useState<any>(null);
  const [isAirLoggedIn, setIsAirLoggedIn] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [isPartnerLoggedIn, setIsPartnerLoggedIn] = useState(false);
  
  // Check AIR login status on component mount
  useEffect(() => {
    const checkAirStatus = async () => {
      try {
        console.log('🔍 Navbar: Checking AIR session...');
        const hasSession = await klyroAirService.checkExistingSession();
        
        if (hasSession) {
          setIsAirLoggedIn(true);
          try {
            const userInfo = await klyroAirService.getUserInfo();
            setAirUserInfo(userInfo);
            console.log('👤 Navbar: AIR user logged in:', userInfo);
          } catch (userInfoError) {
            console.warn('⚠️ Navbar: Could not get user info despite valid session:', userInfoError);
          }
        } else {
          console.log('ℹ️ Navbar: No AIR session found');
          setIsAirLoggedIn(false);
          setAirUserInfo(null);
        }
      } catch (error) {
        console.error('❌ Navbar: Error checking AIR status:', error);
        setIsAirLoggedIn(false);
        setAirUserInfo(null);
      }
    };

    checkAirStatus();
  }, []);

  // Check partner login status on component mount
  useEffect(() => {
    const checkPartnerStatus = () => {
      try {
        const storedPartner = localStorage.getItem('partner');
        if (storedPartner) {
          const partner = JSON.parse(storedPartner);
          setPartnerInfo(partner);
          setIsPartnerLoggedIn(true);
          console.log('👔 Partner logged in:', partner);
        } else {
          setPartnerInfo(null);
          setIsPartnerLoggedIn(false);
        }
      } catch (error) {
        console.error('❌ Error checking partner status:', error);
        setPartnerInfo(null);
        setIsPartnerLoggedIn(false);
      }
    };

    checkPartnerStatus();
  }, []);

  // AIR login handler
  const handleAirLogin = async () => {
    try {
      console.log('🚀 Navbar: Initiating AIR login...');
      await klyroAirService.initialize();
      
      // Refresh state after login
      const state = await klyroAirService.refreshState();
      setIsAirLoggedIn(state.isLoggedIn);
      setAirUserInfo(state.userInfo);
      
      if (state.isLoggedIn) {
        console.log('✅ Navbar: AIR login successful:', state.userInfo);
      } else {
        console.warn('⚠️ Navbar: Login completed but no valid session found');
      }
    } catch (error) {
      console.error('❌ Navbar: AIR login failed:', error);
    }
  };

  // AIR logout handler
  const handleAirLogout = async () => {
    try {
      console.log('🚪 Navbar: Logging out...');
      await klyroAirService.logout();
      
      // Update UI state immediately
      setIsAirLoggedIn(false);
      setAirUserInfo(null);
      
      console.log('✅ Navbar: AIR logout successful');
    } catch (error) {
      console.error('❌ Navbar: AIR logout failed:', error);
      // Still update UI even if logout failed
      setIsAirLoggedIn(false);
      setAirUserInfo(null);
    }
  };

  // AIR wallet handler
  const handleOpenWallet = async () => {
    try {
      console.log('🔗 Opening AIR wallet...');
      await klyroAirService.preloadWallet();
      const provider = await klyroAirService.getWalletProvider();
      console.log('✅ Wallet provider ready:', !!provider);
      
      // You can integrate with web3 libraries here
      // Example: const web3 = new Web3(provider);
      
    } catch (error) {
      console.error('❌ Failed to open wallet:', error);
    }
  };

  // Partner logout handler
  const handlePartnerLogout = () => {
    try {
      localStorage.removeItem('partner');
      setPartnerInfo(null);
      setIsPartnerLoggedIn(false);
      console.log('✅ Partner logout successful');
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Partner logout failed:', error);
    }
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="pt-2">
    <div className="sticky top-0 z-50 border shadow-md dark:shadow-zinc-900/20 shadow-zinc-300/30 bg-background/85 backdrop-blur-md rounded-xl mx-2">
      <nav data-orientation="horizontal" className="mx-auto flex h-16 flex-row items-center px-6 lg:px-8" dir="ltr">
        {/* Left side elements */}
        <Link href="/" className="inline-flex items-center gap-2.5 font-semibold">
          <p className="font-serif italic text-2xl">Klyro</p>
        </Link>
        
        
        {/* Right side elements */}
        <div className="flex flex-row items-center justify-end gap-4 flex-1">
          {/* Partner Account - Show when logged in */}
          {isPartnerLoggedIn && partnerInfo ? (
            <div className="flex items-center gap-2">
              {/* Partner Info Display */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-900/50 rounded-full border border-indigo-700/50">
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                <span className="text-sm text-indigo-300">
                  {partnerInfo.organization?.name || partnerInfo.email || 'Partner'}
                </span>
              </div>
              
              {/* Dashboard Button */}
              <Button
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                size="sm"
                className="px-3 py-1.5 text-sm font-medium rounded-full border-indigo-600/70 text-indigo-400 hover:bg-indigo-950/30 hover:text-indigo-300 hover:border-indigo-500 transition-all duration-200 flex items-center gap-1.5"
              >
                <Shield className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              
              {/* Logout Button */}
              <Button
                onClick={handlePartnerLogout}
                variant="outline"
                size="sm"
                className="px-3 py-1.5 text-sm font-medium rounded-full border-zinc-600/70 text-zinc-400 hover:bg-zinc-950/30 hover:text-zinc-300 hover:border-zinc-500 transition-all duration-200 flex items-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : isAirLoggedIn && airUserInfo ? (
            <div className="flex items-center gap-2">
              {/* User Info Display */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 rounded-full border border-zinc-700/50">
                <UserCheck className="h-3.5 w-3.5 text-green-400" />
                <span className="text-sm text-zinc-300">
                  {airUserInfo.name || airUserInfo.username || airUserInfo.userId || 'AIR User'}
                </span>
              </div>
              
              {/* Wallet Button */}
              <Button
                onClick={handleOpenWallet}
                variant="outline"
                size="sm"
                className="px-3 py-1.5 text-sm font-medium rounded-full border-indigo-600/70 text-indigo-400 hover:bg-indigo-950/30 hover:text-indigo-300 hover:border-indigo-500 transition-all duration-200 flex items-center gap-1.5"
              >
                <Wallet className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Wallet</span>
              </Button>
              
              {/* Logout Button */}
              <Button
                onClick={handleAirLogout}
                variant="outline"
                size="sm"
                className="px-3 py-1.5 text-sm font-medium rounded-full border-zinc-600/70 text-zinc-400 hover:bg-zinc-950/30 hover:text-zinc-300 hover:border-zinc-500 transition-all duration-200 flex items-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            /* Show login and partner buttons when not logged in */
            <>
              <Button
                onClick={handleAirLogin}
                size="sm"
                className="px-4 py-1.5 text-sm font-medium rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-200 flex items-center gap-1.5"
              >
                <User className="h-3.5 w-3.5" />
                Login with AIR
              </Button>
              <Link href="/partner-login">
                <Button
                  variant="outline"
                  size="sm"
                  className="px-4 py-1.5 text-sm font-medium rounded-full border-zinc-600/70 text-zinc-400 hover:bg-zinc-950/30 hover:text-zinc-300 hover:border-zinc-500 transition-all duration-200 flex items-center gap-1.5"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Partner Login
                </Button>
              </Link>
            </>
          )}
        </div>
        
        {/* Mobile Menu */}
        <ul className="flex flex-row items-center gap-2">
          <li className="list-none lg:hidden">
            <button 
              id="mobile-menu-trigger" 
              data-state={isMenuOpen ? "open" : "closed"} 
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu-content"
              onClick={toggleMenu}
              className="data-[state=open]:bg-fd-accent/50 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors duration-100 disabled:pointer-events-none disabled:opacity-50 hover:bg-fd-accent hover:text-fd-accent-foreground p-1.5 [&_svg]:size-5 group -me-2" 
              aria-label="Toggle Menu"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="lucide size-3 transition-transform duration-300 group-data-[state=open]:rotate-180"
              >
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </button>
          </li>
        </ul>
        
      </nav>
      
      {/* Mobile Menu Content (shown when isMenuOpen is true) */}
      {isMenuOpen && (
        <div 
          id="mobile-menu-content"
          className="lg:hidden absolute w-full bg-background border-t border-zinc-200 dark:border-zinc-800 py-2 px-4 shadow-lg z-50"
        >
          <ul className="space-y-2">
            {/* Partner Account - Mobile Version */}
            {isPartnerLoggedIn && partnerInfo ? (
              <>
                <li className="border-b border-zinc-700 pb-2">
                  <div className="flex items-center gap-2 p-2 text-sm text-indigo-300">
                    <Shield className="h-4 w-4 text-indigo-400" />
                    <span>Logged in as {partnerInfo.organization?.name || partnerInfo.email || 'Partner'}</span>
                  </div>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      window.location.href = '/dashboard';
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 p-2 text-sm hover:text-indigo-500 w-full text-left"
                  >
                    <Shield className="h-4 w-4" />
                    Partner Dashboard
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      handlePartnerLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 p-2 text-sm hover:text-zinc-500 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout from Partner
                  </button>
                </li>
              </>
            ) : isAirLoggedIn && airUserInfo ? (
              <>
                <li className="border-b border-zinc-700 pb-2">
                  <div className="flex items-center gap-2 p-2 text-sm text-zinc-300">
                    <UserCheck className="h-4 w-4 text-green-400" />
                    <span>Logged in as {airUserInfo.name || airUserInfo.username || airUserInfo.userId || 'AIR User'}</span>
                  </div>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      handleOpenWallet();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 p-2 text-sm hover:text-indigo-500 w-full text-left"
                  >
                    <Wallet className="h-4 w-4" />
                    Open Wallet
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      handleAirLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 p-2 text-sm hover:text-zinc-500 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout from AIR
                  </button>
                </li>
              </>
            ) : (
              /* Show login and partner options in mobile menu when not logged in */
              <>
                <li>
                  <button 
                    onClick={() => {
                      handleAirLogin();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 p-2 text-sm hover:text-indigo-500 w-full text-left"
                  >
                    <User className="h-4 w-4" />
                    Login with AIR
                  </button>
                </li>
                <li>
                  <Link 
                    href="/partner-login" 
                    className="flex items-center gap-2 p-2 text-sm hover:text-zinc-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    Partner Login
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
    </div>
  );
}