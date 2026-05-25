import {
  Briefcase, Code, Gift,
  Utensils, Car, Home,
  Monitor, Mouse,
  Gamepad2, Tv, Camera,
  Dumbbell, Shirt,
  Wallet, Banknote, Smartphone, CreditCard,
  PiggyBank, Target,
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
  Tag
} from 'lucide-react'

// ============================================
// INCOME CATEGORIES
// ============================================
export const INCOME_CATEGORIES = [
  {
    id: 'income-salary',
    name: 'Pekerjaan Utama',
    parent: 'Pekerjaan',
    icon: 'Briefcase',
    type: 'income',
  },
  {
    id: 'income-freelance',
    name: 'Freelance / Proyek',
    parent: 'Pekerjaan',
    icon: 'Code',
    type: 'income',
  },
  {
    id: 'income-side',
    name: 'Jasa Tambahan / Lainnya',
    parent: 'Lainnya',
    icon: 'Gift',
    type: 'income',
  },
]

// ============================================
// EXPENSE CATEGORIES
// ============================================
export const EXPENSE_CATEGORIES = [
  {
    id: 'expense-food',
    name: 'Makan & Minum',
    parent: 'Kebutuhan Pokok',
    icon: 'Utensils',
    type: 'expense',
  },
  {
    id: 'expense-transport',
    name: 'Transportasi',
    parent: 'Kebutuhan Pokok',
    icon: 'Car',
    type: 'expense',
  },
  {
    id: 'expense-household',
    name: 'Kebutuhan Rumah Tangga',
    parent: 'Kebutuhan Pokok',
    icon: 'Home',
    type: 'expense',
  },
  {
    id: 'expense-hardware',
    name: 'Komponen Hardware',
    parent: 'Gadget & Setup PC',
    icon: 'Monitor',
    type: 'expense',
  },
  {
    id: 'expense-peripheral',
    name: 'Peripheral',
    parent: 'Gadget & Setup PC',
    icon: 'Mouse',
    type: 'expense',
  },
  {
    id: 'expense-games',
    name: 'Belanja Game',
    parent: 'Hobi & Hiburan',
    icon: 'Gamepad2',
    type: 'expense',
  },
  {
    id: 'expense-subscription',
    name: 'Langganan Layanan',
    parent: 'Hobi & Hiburan',
    icon: 'Tv',
    type: 'expense',
  },
  {
    id: 'expense-photography',
    name: 'Fotografi',
    parent: 'Hobi & Hiburan',
    icon: 'Camera',
    type: 'expense',
  },
  {
    id: 'expense-health',
    name: 'Kesehatan & Olahraga',
    parent: 'Kesehatan',
    icon: 'Dumbbell',
    type: 'expense',
  },
  {
    id: 'expense-fashion',
    name: 'Pakaian & Penampilan',
    parent: 'Penampilan',
    icon: 'Shirt',
    type: 'expense',
  },
]

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]

// ============================================
// ICON MAP
// ============================================
export const ICON_MAP = {
  Briefcase, Code, Gift,
  Utensils, Car, Home,
  Monitor, Mouse,
  Gamepad2, Tv, Camera,
  Dumbbell, Shirt,
  Wallet, Banknote, Smartphone, CreditCard,
  PiggyBank, Target,
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
  Tag,
}

/**
 * Get icon component by name
 */
export function getIcon(name) {
  return ICON_MAP[name] || Tag
}

// ============================================
// DEFAULT WALLETS (for new users)
// ============================================
export const DEFAULT_WALLETS = [
  { name: 'Cash', icon: 'Banknote', color: '#10B981' },
  { name: 'Blu by BCA', icon: 'CreditCard', color: '#0EA5E9' },
  { name: 'GoPay', icon: 'Smartphone', color: '#00AED6' },
]

// ============================================
// WALLET ICON OPTIONS
// ============================================
export const WALLET_ICONS = [
  { name: 'Wallet', label: 'Dompet' },
  { name: 'Banknote', label: 'Uang Tunai' },
  { name: 'CreditCard', label: 'Kartu' },
  { name: 'Smartphone', label: 'E-Wallet' },
  { name: 'PiggyBank', label: 'Tabungan' },
]

// ============================================
// WALLET COLOR OPTIONS
// ============================================
export const WALLET_COLORS = [
  '#0EA5E9', // Sky Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#00AED6', // GoPay blue
  '#6366F1', // Indigo
  '#14B8A6', // Teal
]

// ============================================
// MONTH NAMES (Indonesian)
// ============================================
export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

// ============================================
// TRANSACTION TYPE CONFIG
// ============================================
export const TX_TYPE_CONFIG = {
  income: {
    label: 'Pemasukan',
    color: 'var(--color-income)',
    bgColor: 'var(--color-income-light)',
    icon: 'ArrowDownLeft',
    sign: '+',
  },
  expense: {
    label: 'Pengeluaran',
    color: 'var(--color-expense)',
    bgColor: 'var(--color-expense-light)',
    icon: 'ArrowUpRight',
    sign: '-',
  },
  transfer: {
    label: 'Transfer',
    color: 'var(--color-transfer)',
    bgColor: 'var(--color-transfer-light)',
    icon: 'ArrowLeftRight',
    sign: '',
  },
}
