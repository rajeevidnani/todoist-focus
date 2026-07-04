'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setPassword('')
    if (res.ok) {
      router.replace('/')
    } else {
      setError('Wrong password')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" stroke="#1e3a8a" strokeWidth="4"/>
            <path d="M45 25V75H55V25H45Z" fill="#1e3a8a"/>
            <path d="M40 35L45 25H55L45 35H40Z" fill="#172554"/>
          </svg>
          <span className="text-white text-xl font-semibold tracking-tight">One Task View</span>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-blue-700 text-sm"
          />
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
          >
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}
