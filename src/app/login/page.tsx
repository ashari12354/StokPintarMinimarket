"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  Package,
  Lock,
  Mail,
  AlertCircle,
  LogIn,
  Loader2,
  UserCheck,
  ShieldCheck,
  Users,
} from "lucide-react";

interface DemoAccount {
  roleLabel: string;
  email: string;
  password: string;
  badgeColor: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    roleLabel: "Admin",
    email: "admin.stokpintar@mailinator.com",
    password: "StokPintar#2026",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    roleLabel: "Kasir",
    email: "kasir.stokpintar@mailinator.com",
    password: "KasirStok#2026",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    roleLabel: "Reviewer / Instruktur",
    email: "reviewer.stokpintar@mailinator.com",
    password: "ReviewStok#2026",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const handleUseAccount = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setErrorMsg(null);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message || "Email atau password salah. Silakan coba lagi.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan saat mencoba masuk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm mb-3">
            <Package className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Stok Pintar Minimarket
            </h1>
            <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              WMS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Masuk ke Sistem Manajemen Inventaris & Gudang
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs font-medium text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin.stokpintar@mailinator.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses Login...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Masuk ke Dashboard
              </>
            )}
          </button>
        </form>

        {/* Demo / Staff Accounts Section */}
        <div className="mt-7 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Akun Staf / Demo untuk Pemeriksaan
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 mb-3.5">
            Klik tombol <strong>Gunakan Akun</strong> untuk mengisi kolom Email dan Password secara otomatis:
          </p>

          <div className="space-y-2.5">
            {DEMO_ACCOUNTS.map((acc) => {
              const isSelected = email === acc.email && password === acc.password;
              return (
                <div
                  key={acc.email}
                  className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    isSelected
                      ? "bg-indigo-50/50 border-indigo-300"
                      : "bg-slate-50/80 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${acc.badgeColor}`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {acc.roleLabel}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-semibold text-slate-800 truncate">
                      {acc.email}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Pass: <span className="font-semibold text-slate-700">{acc.password}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUseAccount(acc)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    {isSelected ? "Terpilih" : "Gunakan Akun"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Diamankan oleh Supabase Auth (<code>@supabase/ssr</code>)
          </p>
        </div>
      </div>
    </div>
  );
}
