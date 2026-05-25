import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useWallets() {
  const { user } = useAuth()
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Keep a ref to always have the latest wallets (avoids stale closure issues)
  const walletsRef = useRef(wallets)
  walletsRef.current = wallets

  const fetchWallets = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching wallets:', error)
    } else {
      setWallets(data || [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchWallets()
  }, [fetchWallets])

  const totalBalance = wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0)

  const addWallet = async (wallet) => {
    const { data, error } = await supabase
      .from('wallets')
      .insert({ ...wallet, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    setWallets((prev) => [...prev, data])
    return data
  }

  const updateWalletBalance = async (walletId, amount, operation = 'add') => {
    // Use ref to always get the latest wallet state (prevents stale closure)
    const currentWallets = walletsRef.current
    const wallet = currentWallets.find((w) => w.id === walletId)
    if (!wallet) throw new Error('Wallet not found')

    // Ensure both values are numbers
    const currentBalance = Number(wallet.balance) || 0
    const numAmount = Number(amount) || 0

    const newBalance = operation === 'add'
      ? currentBalance + numAmount
      : currentBalance - numAmount

    const { error } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', walletId)

    if (error) throw error

    // Update local state
    setWallets((prev) =>
      prev.map((w) => (w.id === walletId ? { ...w, balance: newBalance } : w))
    )
  }

  const deleteWallet = async (walletId) => {
    const { error } = await supabase
      .from('wallets')
      .update({ is_active: false })
      .eq('id', walletId)

    if (error) throw error
    setWallets((prev) => prev.filter((w) => w.id !== walletId))
  }

  return {
    wallets,
    totalBalance,
    loading,
    addWallet,
    updateWalletBalance,
    deleteWallet,
    refetch: fetchWallets,
  }
}
