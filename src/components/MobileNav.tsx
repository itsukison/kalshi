"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";

export function MobileNav({
  isLoggedIn,
  balanceLabel,
}: {
  isLoggedIn: boolean;
  balanceLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Lock background scroll + allow Escape to close while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const links = [
    { href: "/", label: "マーケット" },
    { href: "/leaderboard", label: "ランキング" },
    ...(isLoggedIn ? [{ href: "/account", label: "マイページ" }] : []),
  ];

  return (
    <>
      <button
        type="button"
        aria-label="メニューを開く"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex size-10 items-center justify-center rounded-[100px] border border-olive-stone text-cream-glow transition-colors hover:border-cream-glow sm:hidden"
      >
        <Menu size={20} />
      </button>

      <div
        className={`fixed inset-0 z-40 sm:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-void-black/70 transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Slide-in panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="メニュー"
          className={`absolute right-0 top-0 flex h-full w-72 max-w-[80%] flex-col border-l border-olive-stone bg-void-black transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-olive-stone px-5 py-4">
            <span className="font-display text-xl font-semibold tracking-tight">
              ヨソウ<span className="text-pulse-green">.</span>
            </span>
            <button
              type="button"
              aria-label="メニューを閉じる"
              onClick={() => setOpen(false)}
              className="inline-flex size-9 items-center justify-center rounded-[100px] border border-olive-stone text-ash-gray transition-colors hover:border-cream-glow hover:text-cream-glow"
            >
              <X size={18} />
            </button>
          </div>

          {isLoggedIn && (
            <div className="border-b border-olive-stone px-5 py-4 text-sm text-ash-gray">
              残高{" "}
              <span className="font-display text-cream-glow tabular-nums">{balanceLabel}</span> pt
            </div>
          )}

          <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
            {links.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-[8px] px-4 py-3 text-base transition-colors ${
                    active
                      ? "bg-olive-stone/30 text-cream-glow"
                      : "text-ash-gray hover:bg-olive-stone/20 hover:text-cream-glow"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-olive-stone px-5 py-4">
            {isLoggedIn ? (
              <LogoutButton expanded />
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="btn-ghost w-full"
              >
                ログイン / 新規登録
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
