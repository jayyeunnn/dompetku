-- ============================================================
-- DompetKu - Personal Finance Tracker
-- Supabase Database Schema
-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Wallets (Dompet)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'wallet',
  balance NUMERIC(15,2) DEFAULT 0,
  color TEXT DEFAULT '#0EA5E9',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Categories (Kategori)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  parent_category TEXT,
  icon TEXT DEFAULT 'tag',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Sinking Funds (Tabungan Target)
CREATE TABLE IF NOT EXISTS sinking_funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC(15,2) NOT NULL,
  current_amount NUMERIC(15,2) DEFAULT 0,
  icon TEXT DEFAULT 'piggy-bank',
  color TEXT DEFAULT '#10B981',
  deadline DATE,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Transactions (Transaksi)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  destination_wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  category_id TEXT,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Sinking Fund Allocations (Alokasi Tabungan Target)
CREATE TABLE IF NOT EXISTS sinking_fund_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sinking_fund_id UUID REFERENCES sinking_funds(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL DEFAULT 'allocate' CHECK (type IN ('allocate', 'withdraw')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sinking_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sinking_fund_allocations ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Wallets
CREATE POLICY "Users can manage own wallets"
  ON wallets FOR ALL USING (auth.uid() = user_id);

-- Categories
CREATE POLICY "Users can manage own categories"
  ON categories FOR ALL USING (auth.uid() = user_id);

-- Sinking Funds
CREATE POLICY "Users can manage own sinking funds"
  ON sinking_funds FOR ALL USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL USING (auth.uid() = user_id);

-- Sinking Fund Allocations
CREATE POLICY "Users can manage own allocations"
  ON sinking_fund_allocations FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_sinking_funds_user ON sinking_funds(user_id);
CREATE INDEX IF NOT EXISTS idx_allocations_fund ON sinking_fund_allocations(sinking_fund_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id, type);
