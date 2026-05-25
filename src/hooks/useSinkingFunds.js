import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useSinkingFunds() {
  const { user } = useAuth()
  const [funds, setFunds] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchFunds = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('sinking_funds')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching sinking funds:', error)
    } else {
      setFunds(data || [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchFunds()
  }, [fetchFunds])

  const totalAllocated = funds.reduce(
    (sum, f) => sum + (Number(f.current_amount) || 0),
    0
  )

  const addFund = async (fund) => {
    const { data, error } = await supabase
      .from('sinking_funds')
      .insert({ ...fund, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    setFunds((prev) => [data, ...prev])
    return data
  }

  const allocate = async (fundId, amount) => {
    const fund = funds.find((f) => f.id === fundId)
    if (!fund) throw new Error('Fund not found')

    const numAmount = Number(amount) || 0
    const newAmount = (Number(fund.current_amount) || 0) + numAmount

    // Update sinking fund
    const { error: fundError } = await supabase
      .from('sinking_funds')
      .update({
        current_amount: newAmount,
        is_completed: newAmount >= Number(fund.target_amount),
      })
      .eq('id', fundId)

    if (fundError) throw fundError

    // Record allocation
    const { error: allocError } = await supabase
      .from('sinking_fund_allocations')
      .insert({
        user_id: user.id,
        sinking_fund_id: fundId,
        amount: numAmount,
        type: 'allocate',
      })

    if (allocError) throw allocError

    setFunds((prev) =>
      prev.map((f) =>
        f.id === fundId
          ? {
              ...f,
              current_amount: newAmount,
              is_completed: newAmount >= Number(f.target_amount),
            }
          : f
      )
    )
  }

  const withdraw = async (fundId, amount) => {
    const fund = funds.find((f) => f.id === fundId)
    if (!fund) throw new Error('Fund not found')

    const newAmount = Math.max(0, Number(fund.current_amount) - amount)

    const { error: fundError } = await supabase
      .from('sinking_funds')
      .update({
        current_amount: newAmount,
        is_completed: false,
      })
      .eq('id', fundId)

    if (fundError) throw fundError

    const { error: allocError } = await supabase
      .from('sinking_fund_allocations')
      .insert({
        user_id: user.id,
        sinking_fund_id: fundId,
        amount,
        type: 'withdraw',
      })

    if (allocError) throw allocError

    setFunds((prev) =>
      prev.map((f) =>
        f.id === fundId
          ? { ...f, current_amount: newAmount, is_completed: false }
          : f
      )
    )
  }

  const deleteFund = async (id) => {
    const { error } = await supabase
      .from('sinking_funds')
      .delete()
      .eq('id', id)

    if (error) throw error
    setFunds((prev) => prev.filter((f) => f.id !== id))
  }

  return {
    funds,
    totalAllocated,
    loading,
    addFund,
    allocate,
    withdraw,
    deleteFund,
    refetch: fetchFunds,
  }
}
