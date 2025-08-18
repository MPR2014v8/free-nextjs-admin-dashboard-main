"use client";
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** สไตล์ badge แบบในภาพตัวอย่าง */
export function Pill({
  children,
  tone = "default",
  size = "sm",
}: {
  children: React.ReactNode;
  tone?: "success" | "warning" | "error" | "default";
  size?: "sm" | "md";
}) {
  const toneMap: Record<string, string> = {
    success:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30",
    warning:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30",
    error:
      "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30",
    default:
      "bg-gray-50 text-gray-700 ring-1 ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10",
  };
  const sizeMap = {
    sm: "px-2 py-0.5 text-[11px] rounded-full",
    md: "px-3 py-1 text-xs rounded-full",
  };
  return (
    <span className={`${toneMap[tone]} ${sizeMap[size]} inline-flex`}>
      {children}
    </span>
  );
}

/** Card + table shell ให้ได้สไตล์เดียวกันทุกที่ */
export function AdminCardTable({
  minWidth = 960,
  children,
}: React.PropsWithChildren<{ minWidth?: number }>) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className={`min-w-[${minWidth}px]`}>{children}</div>
      </div>
    </div>
  );
}

/** Header checkbox แบบมี indeterminate */
export function useHeaderCheckbox(
  selectedCount: number,
  total: number,
  onToggleAll: () => void,
) {
  const ref = React.useRef<HTMLInputElement>(null);
  const checked = total > 0 && selectedCount === total;
  const indeterminate = total > 0 && selectedCount > 0 && selectedCount < total;
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return {
    ref,
    checked,
    onChange: onToggleAll,
  };
}

/** รูปแบบเซลผู้ใช้สั้นๆ (ชื่อ + บรรทัดรอง) */
export function UserCell({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <div className="font-medium text-gray-800 dark:text-white/90">{title}</div>
      {subtitle ? (
        <div className="text-[12px] text-gray-500 dark:text-gray-400">
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

export { Table, TableBody, TableCell, TableHeader, TableRow };
