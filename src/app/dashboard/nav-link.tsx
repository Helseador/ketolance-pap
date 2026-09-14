"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  icon,
  label,
  exact,
}: {
  href: string;
  icon: string;
  label: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
      style={
        isActive
          ? {
              background: "linear-gradient(135deg, var(--brand), var(--brand-dark))",
              boxShadow: "4px 4px 12px #b01062, -2px -2px 6px #f3d0e3",
              color: "white",
            }
          : {
              color: "var(--foreground)",
              opacity: 0.7,
            }
      }
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.boxShadow =
            "3px 3px 8px #d4c2cf, -3px -3px 8px #ffffff";
          (e.currentTarget as HTMLElement).style.opacity = "1";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
          (e.currentTarget as HTMLElement).style.opacity = "0.7";
        }
      }}
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );
}
