import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getMonthRange } from '../lib/formatters'

export function useTransactions(year, month) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    setLoading(true)

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    // Filter by month if provided
    if (year !== undefined && month !== undefined) {
      const { start, end } = getMonthRange(year, month)
      query = query.gte('date', start).lte('date', end)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
    } else {
      setTransactions(data || [])
    }
    setLoading(false)
  }, [user, year, month])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const addTransaction = async (transaction) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...transaction, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    setTransactions((prev) => [data, ...prev])
    return data
  }

  const deleteTransaction = async (id) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) throw error
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const updateTransaction = async (id, updates) => {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? data : t))
    )
    return data
  }

  // Get recent N transactions (for dashboard)
  const getRecent = (n = 5) => transactions.slice(0, n)

  // Group transactions by date
  const groupedByDate = transactions.reduce((groups, tx) => {
    const date = tx.date
    if (!groups[date]) groups[date] = []
    groups[date].push(tx)
    return groups
  }, {})

  // Monthly summary
  const summary = transactions.reduce(
    (acc, tx) => {
      const amount = Number(tx.amount)
      if (tx.type === 'income') acc.income += amount
      if (tx.type === 'expense') acc.expense += amount
      return acc
    },
    { income: 0, expense: 0 }
  )

  return {
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    getRecent,
    groupedByDate,
    summary,
    refetch: fetchTransactions,
  }
}
