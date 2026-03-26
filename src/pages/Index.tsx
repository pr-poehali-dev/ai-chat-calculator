import { useState } from "react";
import Icon from "@/components/ui/icon";
import ChatSection from "@/components/ChatSection";
import DiarySection from "@/components/DiarySection";
import CalculatorSection from "@/components/CalculatorSection";
import SettingsSection from "@/components/SettingsSection";

type Tab = "chat" | "diary" | "calc" | "settings";

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "chat", icon: "MessageCircle", label: "Чат" },
  { id: "diary", icon: "BookOpen", label: "Дневник" },
  { id: "calc", icon: "Calculator", label: "Калькулятор" },
  { id: "settings", icon: "Settings", label: "Настройки" },
];

export default function Index() {
  const [tab, setTab] = useState<Tab>("chat");

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,109,248,0.12) 0%, transparent 70%), #0b0c14",
      }}
    >
      {/* Ambient orbs */}
      <div
        className="pointer-events-none fixed"
        style={{
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,109,248,0.07) 0%, transparent 70%)",
          top: -100,
          right: -100,
        }}
      />
      <div
        className="pointer-events-none fixed"
        style={{
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)",
          bottom: 0,
          left: 0,
        }}
      />

      {/* Sidebar — hidden on mobile */}
      <aside className="hidden sm:flex flex-col w-[72px] flex-shrink-0 border-r border-[var(--nova-border)] py-5 items-center gap-2 z-10">
        {/* Logo */}
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7c6df8] to-[#4f46e5] flex items-center justify-center mb-4 animate-pulse-glow">
          <span className="text-white font-bold text-sm">N</span>
        </div>

        {/* Nav */}
        {TABS.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            title={label}
            className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 group
              ${
                tab === id
                  ? "bg-[var(--nova-indigo)] text-white shadow-lg"
                  : "text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-white/5"
              }`}
          >
            <Icon name={icon as "MessageCircle"} size={18} />
            {/* Tooltip */}
            <div className="absolute left-[calc(100%+10px)] bg-[#1a1b2e] border border-[var(--nova-border)] text-[var(--nova-text)] text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              {label}
            </div>
            {/* Active indicator */}
            {tab === id && (
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[var(--nova-indigo)]" />
            )}
          </button>
        ))}

        {/* Avatar */}
        <div className="mt-auto">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c6df8]/30 to-[#4f46e5]/30 border border-[var(--nova-indigo)]/30 flex items-center justify-center text-xs font-bold text-[var(--nova-indigo)]">
            П
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center px-6 py-3 border-b border-[var(--nova-border)] gap-3 flex-shrink-0">
          {TABS.filter((t) => t.id === tab).map(({ label }) => (
            <span key={label} className="text-sm font-semibold text-[var(--nova-text)]">
              {label}
            </span>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 glass px-2.5 py-1 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Синхронизировано
            </div>
            <div className="text-xs text-[var(--nova-text-muted)] hidden sm:block">
              {new Date().toLocaleDateString("ru", { day: "numeric", month: "long" })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {tab === "chat" && (
            <div className="h-full animate-fade-in">
              <ChatSection />
            </div>
          )}
          {tab === "diary" && (
            <div className="h-full animate-fade-in">
              <DiarySection />
            </div>
          )}
          {tab === "calc" && (
            <div className="h-full overflow-y-auto animate-fade-in">
              <CalculatorSection />
            </div>
          )}
          {tab === "settings" && (
            <div className="h-full animate-fade-in">
              <SettingsSection />
            </div>
          )}
        </div>

        {/* Mobile bottom nav */}
        <div className="sm:hidden flex border-t border-[var(--nova-border)] bg-[#0b0c14] flex-shrink-0">
          {TABS.map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] transition-colors
                ${tab === id ? "text-[var(--nova-indigo)]" : "text-[var(--nova-text-muted)]"}`}
            >
              <Icon name={icon as "MessageCircle"} size={18} />
              {label}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
