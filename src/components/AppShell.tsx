import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  CalendarClock,
  Database,
  FileBarChart2,
  FileUp,
  Kanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  Star,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useATS } from '../context/ATSContext';
import { runLocalSmartSearch } from '../lib/matchingEngine';
import type { NavModule } from '../types';

export const NAV_ITEMS: { id: NavModule; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'candidates', label: 'Candidates', icon: Users },
  { id: 'applications', label: 'Applications', icon: Kanban },
  { id: 'resume-parser', label: 'Resume Parser', icon: FileUp },
  { id: 'ai-recommendations', label: 'AI Recommendations', icon: Sparkles },
  { id: 'interview-center', label: 'Interview Center', icon: CalendarClock },
  { id: 'talent-pool', label: 'Talent Pool', icon: Database },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'assistant', label: 'Recruitment Assistant', icon: Bot },
  { id: 'reports', label: 'Reports', icon: FileBarChart2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface AppShellProps {
  activeModule: NavModule;
  onSelectModule: (m: NavModule) => void;
  globalSearch: string;
  onGlobalSearchChange: (val: string) => void;
  onInspectCandidate: (candidateId: string) => void;
  onOpenSmartSearch?: (query: string) => void;
  children: React.ReactNode;
}

export function AppShell({
  activeModule,
  onSelectModule,
  globalSearch,
  onGlobalSearchChange,
  onInspectCandidate,
  onOpenSmartSearch,
  children,
}: AppShellProps) {
  const { user, logout, loginWithGoogle, notifications, markNotificationRead, markAllNotificationsRead, candidates, jobs, settings } =
    useATS();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const favoriteCandidates = useMemo(
    () => candidates.filter((c) => c.isFavorite || c.isPriority || c.isWatchlist),
    [candidates]
  );

  const searchResults = useMemo(() => {
    const q = globalSearch.trim();
    if (!q) return { candidates: [], jobs: [] };
    const lower = q.toLowerCase();
    return {
      candidates: runLocalSmartSearch(q, candidates).slice(0, 5),
      jobs: jobs
        .filter(
          (j) =>
            j.title.toLowerCase().includes(lower) ||
            j.department.toLowerCase().includes(lower) ||
            j.location.toLowerCase().includes(lower) ||
            j.requiredSkills.some((s) => s.toLowerCase().includes(lower))
        )
        .slice(0, 3),
    };
  }, [globalSearch, candidates, jobs]);

  const activeLabel = NAV_ITEMS.find((i) => i.id === activeModule)?.label || 'Dashboard';

  const SidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800/90">
      <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
        <div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-display">
            HireSmart <span className="text-[#00D4FF]">AI</span>
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[175px] mt-0.5">
            {settings.organizationName}
          </p>
        </div>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectModule(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-[#00D4FF]/15 text-[#0284C7] dark:text-[#00D4FF] border border-[#00D4FF]/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-slate-700"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#6C63FF]/20 border border-[#6C63FF]/40 flex items-center justify-center text-xs font-bold text-[#6C63FF]">
              {(user?.displayName || 'G').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.displayName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.isGuest ? 'Guest Demo Mode' : user?.email}
            </p>
          </div>
        </div>

        {user?.isGuest && (
          <button
            onClick={loginWithGoogle}
            className="w-full py-2 px-3 rounded-lg bg-[#00D4FF] text-slate-950 font-semibold text-xs hover:bg-[#33ddff] transition-colors cursor-pointer"
          >
            Login with Google to Save
          </button>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-white flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 sticky top-0 h-screen">{SidebarContent}</aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-[268px] max-w-[85vw] h-full z-10">{SidebarContent}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/85 dark:bg-[#0F172A]/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/90 px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                aria-label="Open navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-sm truncate">
                <span className="text-slate-400 hidden sm:inline">Workspace</span>
                <span className="text-slate-500 hidden sm:inline">/</span>
                <span className="font-semibold text-slate-900 dark:text-white truncate">{activeLabel}</span>
              </div>
            </div>

            {/* Smart Search Engine */}
            <div className="relative flex-1 max-w-md hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => onGlobalSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && globalSearch.trim() && onOpenSmartSearch) {
                    onOpenSmartSearch(globalSearch.trim());
                    onGlobalSearchChange('');
                  }
                }}
                placeholder='Smart Search: "React developers with AWS" or "3+ yrs Mumbai"...'
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00D4FF]"
              />

              {globalSearch.trim().length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-3 z-50 space-y-3">
                  {searchResults.candidates.length === 0 && searchResults.jobs.length === 0 ? (
                    <p className="text-xs text-slate-400 px-2 py-1">No matching candidates or jobs found.</p>
                  ) : (
                    <>
                      {searchResults.candidates.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between px-2 mb-1">
                            <p className="text-[11px] font-semibold text-slate-400">Smart Search Candidates</p>
                            {onOpenSmartSearch && (
                              <button
                                onClick={() => {
                                  onOpenSmartSearch(globalSearch.trim());
                                  onGlobalSearchChange('');
                                }}
                                className="text-[11px] text-[#00D4FF] hover:underline cursor-pointer"
                              >
                                Filter in Candidates
                              </button>
                            )}
                          </div>
                          {searchResults.candidates.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                onInspectCandidate(c.id);
                                onGlobalSearchChange('');
                              }}
                              className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.fullName}</p>
                                <p className="text-xs text-slate-400 truncate">
                                  {c.experienceYears} yrs · {c.location} · {c.skills.slice(0, 3).join(', ')}
                                </p>
                              </div>
                              <span className="text-xs font-mono tabular-nums text-[#14F195] font-semibold shrink-0">
                                {c.matchScore}%
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.jobs.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-slate-400 px-2 mb-1">Jobs</p>
                          {searchResults.jobs.map((j) => (
                            <button
                              key={j.id}
                              onClick={() => {
                                onSelectModule('jobs');
                                onGlobalSearchChange('');
                              }}
                              className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{j.title}</p>
                                <p className="text-xs text-slate-400">{j.department} · {j.location}</p>
                              </div>
                              <span className="text-xs text-[#00D4FF]">{j.status}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Favorites Quick Access, Notifications & Quick Action */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Favorites Quick Access Panel */}
              <div className="relative">
                <button
                  onClick={() => {
                    setFavOpen((o) => !o);
                    setNotifOpen(false);
                  }}
                  aria-label="Open favorite candidates"
                  className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 text-amber-400 hover:border-amber-400/60 transition-colors cursor-pointer"
                >
                  <Star className="w-4 h-4 fill-amber-400/30" />
                  {favoriteCandidates.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold font-mono tabular-nums flex items-center justify-center">
                      {favoriteCandidates.length}
                    </span>
                  )}
                </button>

                {favOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 z-50">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Favorites & Watchlist</h3>
                      <button
                        onClick={() => {
                          onSelectModule('candidates');
                          setFavOpen(false);
                        }}
                        className="text-xs text-[#00D4FF] hover:underline cursor-pointer"
                      >
                        View All
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 mt-1">
                      {favoriteCandidates.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">No starred or priority candidates yet.</p>
                      ) : (
                        favoriteCandidates.slice(0, 8).map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              onInspectCandidate(c.id);
                              setFavOpen(false);
                            }}
                            className="w-full text-left py-2.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{c.fullName}</p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {[
                                  c.isFavorite ? 'Starred' : '',
                                  c.isPriority ? 'Priority' : '',
                                  c.isWatchlist ? 'Watchlist' : '',
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            </div>
                            <span className="text-xs font-mono font-bold text-[#14F195] tabular-nums">{c.matchScore}%</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setNotifOpen((o) => !o);
                    setFavOpen(false);
                  }}
                  aria-label="Open notifications"
                  className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-[#00D4FF]/60 transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#00D4FF] text-slate-950 text-[10px] font-bold font-mono tabular-nums flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 z-50">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-[#00D4FF] hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 mt-1">
                      {notifications.slice(0, 8).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`w-full text-left py-3 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer ${
                            n.read ? 'opacity-65' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-medium text-[#00D4FF]">{n.type}</span>
                            <span className="text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{n.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => onSelectModule('resume-parser')}
                className="px-4 py-2 rounded-xl bg-[#00D4FF] text-slate-950 font-semibold text-xs sm:text-sm hover:bg-[#33ddff] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Upload Resume
              </button>
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
