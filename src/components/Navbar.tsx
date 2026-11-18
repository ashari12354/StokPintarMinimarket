"use client";

import React from "react";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  BellRing,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { UserRole } from "@/types/inventory";

export type ActiveTab = "dashboard" | "inventory" | "transactions" | "automation";

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  criticalCount: number;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  role,
  setRole,
  criticalCount,
}: NavbarProps) {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: "inventory",
      label: "Master Stok",
      icon: <Package className="w-4 h-4" />,
      badge: criticalCount > 0 ? criticalCount : undefined,
    },
    {
      id: "transactions",
      label: "Transaksi Masuk/Keluar",
      icon: <ArrowLeftRight className="w-4 h-4" />,
    },
    {
      id: "automation",
      label: "Alert & Webhook n8n",
      icon: <BellRing className="w-4 h-4" />,
      badge: criticalCount > 0 ? criticalCount : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                    Stok Pintar Minimarket
                  </h1>
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Warehouse WMS
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Sistem Manajemen Inventaris & Otomasi Stok Real-Time
                </p>
              </div>
            </div>

            {/* Mobile Role Switcher */}
            <div className="flex md:hidden items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setRole("Admin")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  role === "Admin"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRole("Staff")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  role === "Staff"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Staff
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-0.5 px-1.5 py-0.2 text-[11px] font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop RBAC Role Switcher */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Mode Akses (RBAC)
              </div>
              <div className="text-xs font-semibold text-slate-700">
                {role === "Admin" ? "Budi Santoso (Full Access)" : "Rina Putri (Input Transaksi)"}
              </div>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setRole("Admin")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  role === "Admin"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRole("Staff")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  role === "Staff"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Staff
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
