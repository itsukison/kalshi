"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type DropdownOption<T extends string> = { value: T; label: string };

export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  icon,
  ariaLabel,
  className = "",
  mobileIconOnly = false,
}: {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  icon?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
  mobileIconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  // Close on outside click while open.
  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  // Open the menu with the current value pre-highlighted.
  function openMenu() {
    setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function choose(index: number) {
    const opt = options[index];
    if (opt) {
      onChange(opt.value);
      setOpen(false);
    }
  }

  function onKeyDown(event: React.KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) openMenu();
        else setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        if (open) setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (open) choose(activeIndex);
        else openMenu();
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`flex h-12 w-full items-center rounded-[8px] border border-olive-stone bg-void-black text-sm text-cream-glow outline-none transition-colors hover:border-cream-glow focus:border-cream-glow ${
          mobileIconOnly ? "justify-center px-0 sm:justify-start sm:gap-2 sm:px-4" : "gap-2 px-4"
        }`}
      >
        {icon}
        <span
          className={
            mobileIconOnly
              ? "sr-only sm:not-sr-only sm:flex-1 sm:truncate sm:text-left"
              : "flex-1 truncate text-left"
          }
        >
          {selected?.label}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-ash-gray transition-transform ${
            mobileIconOnly ? "hidden sm:block" : ""
          } ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute z-20 mt-2 overflow-hidden rounded-[8px] border border-olive-stone bg-void-black py-1 ${
            mobileIconOnly ? "right-0 w-64 sm:w-full" : "w-full"
          }`}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isActive = i === activeIndex;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors ${
                  isActive ? "bg-olive-stone/40 text-cream-glow" : "text-ash-gray"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={15} className="shrink-0 text-pulse-green" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
