"use client"

import { useEffect, useState } from 'react'
import { createPublicClient, http } from 'viem'
import { celoAlfajores } from '@/components/providers'

const PREDICTION_CONTRACT = '0x93b07e384dA57399AF517C6492840CA8d70BD11A'

// ABI for reading public variables from PancakePredictionV2
const PREDICTION_ABI = [
  {
    inputs: [],
    name: 'intervalSeconds',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'bufferSeconds',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export function useRoundConfig() {
  const [intervalSeconds, setIntervalSeconds] = useState<number | null>(null)
  const [bufferSeconds, setBufferSeconds] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const publicClient = createPublicClient({
      chain: celoAlfajores,
      transport: http('https://alfajores-forno.celo-testnet.org'),
    })

    const fetchConfig = async () => {
      try {
        console.log('🔧 Fetching round configuration from contract...')

        const [interval, buffer] = await Promise.all([
          publicClient.readContract({
            address: PREDICTION_CONTRACT,
            abi: PREDICTION_ABI,
            functionName: 'intervalSeconds',
          }),
          publicClient.readContract({
            address: PREDICTION_CONTRACT,
            abi: PREDICTION_ABI,
            functionName: 'bufferSeconds',
          }),
        ])

        const intervalSec = Number(interval)
        const bufferSec = Number(buffer)

        console.log('=== ROUND CONFIGURATION ===')
        console.log('Contract:', PREDICTION_CONTRACT)
        console.log('Interval Seconds:', intervalSec, 'seconds')
        console.log('Buffer Seconds:', bufferSec, 'seconds')
        console.log('Betting Window:', intervalSec - bufferSec, 'seconds (open for betting)')
        console.log('Lock Period:', bufferSec, 'seconds (last', bufferSec, 's before round ends)')
        console.log('===========================')

        setIntervalSeconds(intervalSec)
        setBufferSeconds(bufferSec)
        setIsLoading(false)
        setError(null)
      } catch (err) {
        console.error('❌ Error fetching round config:', err)
        setError('Failed to fetch config')
        setIsLoading(false)
      }
    }

    fetchConfig()
  }, [])

  return {
    intervalSeconds,
    bufferSeconds,
    // Derived values
    bettingWindowSeconds: intervalSeconds && bufferSeconds ? intervalSeconds - bufferSeconds : null,
    isLoading,
    error,
  }
}
