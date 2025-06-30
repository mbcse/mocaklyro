"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to create page for profile generation
    router.push('/create');
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Creating Your Profile</h1>
        <p className="text-zinc-400">Redirecting to profile creation...</p>
      </div>
    </div>
  );
} 