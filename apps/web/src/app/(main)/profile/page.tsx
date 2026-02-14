"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("vibechain_user");
    const token = localStorage.getItem("vibechain_token");

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        router.replace(`/users/${user.id}`);
      } catch {
        router.replace("/login");
      }
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-pulse text-slate-500">Redirecting to profile...</div>
    </div>
  );
}
