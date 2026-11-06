import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  Banknote,
  Bike,
  BookOpen,
  Briefcase,
  Bus,
  Car,
  ChartLine,
  Clapperboard,
  Coffee,
  Coins,
  CreditCard,
  Dog,
  Dumbbell,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Laptop,
  Lightbulb,
  Music,
  Pill,
  PiggyBank,
  Plane,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Shirt,
  Smartphone,
  Tag,
  TrendingUp,
  Utensils,
  Wallet,
} from 'lucide-react';
import { cn, softColor } from '@/utils/format';

/**
 * Curated, minimal icon set for categories (lucide). The stored value is the
 * kebab-case lucide name ("utensils"), so it stays future-proof and text-only.
 */
export interface CategoryIconOption {
  /** Stored in the DB (e.g. "utensils"). */
  name: string;
  /** Human label for a11y. */
  label: string;
  Icon: LucideIcon;
}

export const CATEGORY_ICONS: CategoryIconOption[] = [
  { name: 'utensils', label: 'Food', Icon: Utensils },
  { name: 'coffee', label: 'Coffee', Icon: Coffee },
  { name: 'shopping-bag', label: 'Shopping', Icon: ShoppingBag },
  { name: 'shopping-cart', label: 'Groceries', Icon: ShoppingCart },
  { name: 'shirt', label: 'Clothing', Icon: Shirt },
  { name: 'tag', label: 'Tag', Icon: Tag },
  { name: 'bus', label: 'Transit', Icon: Bus },
  { name: 'car', label: 'Car', Icon: Car },
  { name: 'bike', label: 'Bike', Icon: Bike },
  { name: 'plane', label: 'Travel', Icon: Plane },
  { name: 'house', label: 'Home', Icon: House },
  { name: 'lightbulb', label: 'Utilities', Icon: Lightbulb },
  { name: 'receipt', label: 'Receipt', Icon: Receipt },
  { name: 'smartphone', label: 'Phone', Icon: Smartphone },
  { name: 'credit-card', label: 'Card', Icon: CreditCard },
  { name: 'chart-line', label: 'Charts', Icon: ChartLine },
  { name: 'gamepad-2', label: 'Games', Icon: Gamepad2 },
  { name: 'clapperboard', label: 'Movies', Icon: Clapperboard },
  { name: 'music', label: 'Music', Icon: Music },
  { name: 'heart-pulse', label: 'Health', Icon: HeartPulse },
  { name: 'pill', label: 'Medicine', Icon: Pill },
  { name: 'dumbbell', label: 'Fitness', Icon: Dumbbell },
  { name: 'book-open', label: 'Books', Icon: BookOpen },
  { name: 'graduation-cap', label: 'Education', Icon: GraduationCap },
  { name: 'baby', label: 'Kids', Icon: Baby },
  { name: 'dog', label: 'Pets', Icon: Dog },
  { name: 'briefcase', label: 'Work', Icon: Briefcase },
  { name: 'laptop', label: 'Laptop', Icon: Laptop },
  { name: 'wallet', label: 'Wallet', Icon: Wallet },
  { name: 'banknote', label: 'Cash', Icon: Banknote },
  { name: 'piggy-bank', label: 'Savings', Icon: PiggyBank },
  { name: 'coins', label: 'Coins', Icon: Coins },
  { name: 'trending-up', label: 'Investment', Icon: TrendingUp },
  { name: 'gift', label: 'Gift', Icon: Gift },
];

const ICON_MAP = new Map(CATEGORY_ICONS.map((option) => [option.name, option.Icon]));

/** Categories created before the lucide switch store emoji — keep those rendering as text. */
function looksLikeEmoji(value: string): boolean {
  return /[^\u0000-\u007F]/.test(value);
}

export function isKnownCategoryIcon(name: string): boolean {
  return ICON_MAP.has(name);
}

/**
 * Renders a category glyph: lucide icon when the stored name matches the set,
 * the original emoji/text otherwise, and a Tag placeholder when unset.
 */
export function CategoryGlyph({
  icon,
  className,
}: {
  icon?: string;
  className?: string;
}) {
  if (icon && looksLikeEmoji(icon)) {
    return <span className="block text-center leading-none">{icon}</span>;
  }
  const Icon = (icon && ICON_MAP.get(icon)) || Tag;
  return <Icon className={cn('shrink-0', className)} />;
}

/** Chip with a category-tinted square and the glyph centered inside it. */
export function CategoryIconChip({
  icon,
  color,
  size = 'md',
}: {
  icon?: string;
  color?: string;
  size?: 'md' | 'sm';
}) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-xl',
        size === 'md' ? 'grid h-10 w-10 place-items-center' : 'grid h-7 w-7 place-items-center rounded-lg',
      )}
      style={{ backgroundColor: softColor(color) }}
      aria-hidden="true"
    >
      <CategoryGlyph
        icon={icon}
        className={size === 'md' ? 'h-5 w-5 text-[17px]' : 'h-4 w-4 text-[13px]'}
      />
    </span>
  );
}
