/**
 * Centralised icon utilities for FinLens.
 *
 * Category icons are stored in the DB as either:
 *   - A Lucide icon name string  (e.g. "ShoppingCart") – rendered as Lucide SVG
 *   - A legacy emoji string      (e.g. "🏷️")          – rendered as plain text
 *
 * Use `CategoryIcon` anywhere a category icon is displayed and
 * `CATEGORY_ICONS` / `ICON_PALETTE` for the icon-picker in the Add Category modal.
 */

import {
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Wifi,
  Gamepad2,
  Heart,
  Plane,
  Coffee,
  Music,
  Shirt,
  BookOpen,
  Tv,
  Dumbbell,
  Baby,
  PawPrint,
  Zap,
  Gift,
  Briefcase,
  Stethoscope,
  GraduationCap,
  Fuel,
  Receipt,
  Package,
  type LucideIcon,
} from 'lucide-react';

// ── Category icon picker set ──────────────────────────────────────────────────

export type CategoryIconEntry = {
  name: string;
  Icon: LucideIcon;
};

export const CATEGORY_ICONS: CategoryIconEntry[] = [
  { name: 'ShoppingCart', Icon: ShoppingCart },
  { name: 'Utensils', Icon: Utensils },
  { name: 'Car', Icon: Car },
  { name: 'Home', Icon: Home },
  { name: 'Wifi', Icon: Wifi },
  { name: 'Gamepad2', Icon: Gamepad2 },
  { name: 'Heart', Icon: Heart },
  { name: 'Plane', Icon: Plane },
  { name: 'Coffee', Icon: Coffee },
  { name: 'Music', Icon: Music },
  { name: 'Shirt', Icon: Shirt },
  { name: 'BookOpen', Icon: BookOpen },
  { name: 'Tv', Icon: Tv },
  { name: 'Dumbbell', Icon: Dumbbell },
  { name: 'Baby', Icon: Baby },
  { name: 'PawPrint', Icon: PawPrint },
  { name: 'Zap', Icon: Zap },
  { name: 'Gift', Icon: Gift },
  { name: 'Briefcase', Icon: Briefcase },
  { name: 'Stethoscope', Icon: Stethoscope },
  { name: 'GraduationCap', Icon: GraduationCap },
  { name: 'Fuel', Icon: Fuel },
  { name: 'Receipt', Icon: Receipt },
  { name: 'Package', Icon: Package },
];

// Lookup map for rendering icons by stored name string.
const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  CATEGORY_ICONS.map(({ name, Icon }) => [name, Icon])
);

// ── Color palette (auto-assigned on category creation) ───────────────────────

export const ICON_PALETTE = [
  '#25D366', '#6C5CE7', '#0984E3', '#E17055', '#FDCB6E',
  '#FD79A8', '#00CEC9', '#A29BFE', '#74B9FF', '#55EFC4',
  '#FAB1A0', '#FF7675',
];

export function randomIconColor(): string {
  return ICON_PALETTE[Math.floor(Math.random() * ICON_PALETTE.length)];
}

// ── CategoryIcon renderer ─────────────────────────────────────────────────────

type CategoryIconProps = {
  icon: string | null | undefined;
  size?: number;
  strokeWidth?: number;
};

/**
 * Renders a category icon. If the stored string matches a known Lucide icon
 * name it renders the SVG; otherwise it falls back to rendering the raw string
 * (legacy emojis, custom characters, bullet, etc.).
 */
export function CategoryIcon({ icon, size = 16, strokeWidth = 2 }: CategoryIconProps) {
  if (!icon) return <span>•</span>;
  const LucideComp = ICON_MAP[icon];
  if (LucideComp) return <LucideComp size={size} strokeWidth={strokeWidth} />;
  // Legacy emoji / custom text fallback
  return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>;
}
