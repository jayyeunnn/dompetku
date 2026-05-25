-- Create recurring_bills table
CREATE TABLE recurring_bills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  last_paid_period TEXT, -- Format: 'YYYY-MM'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own recurring bills" 
  ON recurring_bills FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring bills" 
  ON recurring_bills FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring bills" 
  ON recurring_bills FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring bills" 
  ON recurring_bills FOR DELETE 
  USING (auth.uid() = user_id);
