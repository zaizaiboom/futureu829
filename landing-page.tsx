"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import AppShell from "@/components/app-shell";
import ProductIntro from "@/components/product-intro";
import HowItWorks from "@/components/how-it-works";
import InterviewModulesSection from "@/components/interview-modules-section";
import CoreFeatures from "@/components/core-features";
import QuickTips from "@/components/quick-tips";

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleStartPractice = (module: "hr" | "professional" | "final") => {
    router.push(`/interview-practice?module=${module}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <main className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <ProductIntro />
        <HowItWorks />
        <CoreFeatures />
        <InterviewModulesSection onStartPractice={handleStartPractice} />
        <QuickTips />
      </main>
    </AppShell>
  );
}
