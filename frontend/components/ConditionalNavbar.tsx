"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Hide navbar on KlyroGate pages to make them standalone with organization branding
  const isKlyroGatePage = pathname?.startsWith('/klyrogate/');
  
  // Hide navbar on partner dashboard pages since they have their own header
  const isDashboardPage = pathname?.startsWith('/dashboard') || pathname === '/dashboard';
  
  // Hide navbar on partner login page to avoid AIR conflicts
  const isPartnerLoginPage = pathname === '/partner-login';
  
  // KlyroGate pages should be completely standalone without Klyro branding
  // Dashboard pages have their own header and don't need AIR functionality
  // Partner login page doesn't need AIR functionality  
  if (isKlyroGatePage || isDashboardPage || isPartnerLoginPage) {
    return null;
  }
  
  // Show normal Klyro navbar on all other pages
  return <Navbar />;
} 