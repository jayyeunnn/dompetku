import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useRecurringBills() {
  const { user } = useAuth()
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchBills = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data, error } = await supabase
      .from('recurring_bills')
      .select('*')
      .eq('user_id', user.id)
      .order('due_day', { ascending: true })

    if (error) {
      console.error('Error fetching recurring bills:', error)
    } else {
      setBills(data || [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchBills()
  }, [fetchBills])

  const addBill = async (billData) => {
    const { data, error } = await supabase
      .from('recurring_bills')
      .insert({
        ...billData,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    setBills((prev) => {
      const newBills = [...prev, data]
      return newBills.sort((a, b) => a.due_day - b.due_day)
    })
    return data
  }

  const deleteBill = async (id) => {
    const { error } = await supabase
      .from('recurring_bills')
      .delete()
      .eq('id', id)

    if (error) throw error
    setBills((prev) => prev.filter((b) => b.id !== id))
  }

  const markAsPaid = async (id, periodStr) => {
    const { data, error } = await supabase
      .from('recurring_bills')
      .update({ last_paid_period: periodStr })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setBills((prev) => prev.map((b) => (b.id === id ? data : b)))
    return data
  }

  return {
    bills,
    loading,
    addBill,
    deleteBill,
    markAsPaid,
    refetch: fetchBills
  }
}
