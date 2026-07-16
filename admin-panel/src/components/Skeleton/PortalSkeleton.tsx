import type { FC } from "react";

const PortalSkeleton: FC = () => {
  return (
    <div className="min-h-screen bg-[#121212] text-zinc-150 flex flex-col lg:flex-row">
      {/* Mobile header skeleton */}
      <header className="fixed top-0 z-50 flex h-14 w-full items-center justify-between border-b border-white/5 bg-[#18181b] px-4 lg:hidden">
        <div className="flex items-center gap-2">
          {/* Menu button placeholder */}
          <div className="h-9 w-9 rounded-lg bg-zinc-800 animate-pulse" />
          {/* Logo placeholder */}
          <div className="h-6 w-24 rounded bg-zinc-800 animate-pulse ml-2" />
        </div>
        {/* Profile avatar placeholder */}
        <div className="h-8 w-8 rounded-full bg-zinc-800 animate-pulse" />
      </header>

      {/* Sidebar skeleton (desktop only) */}
      <aside
        className="fixed top-0 left-0 z-40 hidden lg:flex h-screen w-[260px] flex-col border-e border-white/5 bg-[#18181b]"
        aria-label="Loading layout"
      >
        {/* Brand/logo block */}
        <div className="flex border-b border-white/5 p-4 items-center h-[76px] shrink-0 gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-transparent font-bold">
            G
          </div>
          <div className="h-5 w-28 rounded bg-zinc-800 animate-pulse" />
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-6 px-4 overflow-y-auto space-y-4">
          <div className="h-3 w-16 rounded bg-zinc-800 animate-pulse mb-4 mx-2" />
          <ul className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <li key={i}>
                <div className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl bg-zinc-900/50">
                  {/* Menu Icon */}
                  <div className="h-5 w-5 rounded-md bg-zinc-800 animate-pulse shrink-0" />
                  {/* Menu text */}
                  <div className="h-4 w-28 rounded bg-zinc-800 animate-pulse" />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* User profile section */}
        <div className="border-t border-white/5 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-zinc-800 animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="h-4 w-20 rounded bg-zinc-800 animate-pulse" />
            <div className="h-3 w-28 rounded bg-zinc-800 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="min-h-screen bg-[#121212] pt-14 lg:pt-0 lg:ml-[260px] flex-1 flex flex-col">
        <div className="flex h-full w-full flex-1 flex-col gap-6 p-4 lg:p-8">
          {/* Header section skeleton */}
          <div className="space-y-2.5">
            <div className="h-8 w-48 rounded bg-zinc-800 animate-pulse" />
            <div className="h-4 w-72 rounded bg-zinc-800 animate-pulse" />
          </div>

          {/* Grid of metrics/stats cards (4 items for admin dashboard) */}
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl border border-white/5 bg-zinc-900/40 p-6 space-y-4"
              >
                <div className="h-4 w-24 rounded bg-zinc-800 animate-pulse" />
                <div className="h-8 w-14 rounded bg-zinc-800 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Guard Activity Monitor / Main List skeleton */}
          <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-6 space-y-6 flex-1">
            <div className="h-6 w-56 rounded bg-zinc-800 animate-pulse" />
            <div className="flex gap-3">
              <div className="h-10 flex-1 rounded bg-zinc-800 animate-pulse" />
              <div className="h-10 w-44 rounded bg-zinc-800 animate-pulse" />
            </div>
            <div className="space-y-4 pt-4 border-t border-white/5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 py-2 border-b border-white/5 last:border-b-0">
                  <div className="h-5 w-32 rounded bg-zinc-800 animate-pulse" />
                  <div className="h-5 w-24 rounded bg-zinc-800 animate-pulse" />
                  <div className="h-5 w-48 rounded bg-zinc-800 animate-pulse" />
                  <div className="h-5 w-24 rounded bg-zinc-800 animate-pulse shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PortalSkeleton;
