'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/dashboard')
      } else {
        router.replace('/auth/login')
      }
    })
  }, [router])

  return (
    <div className="min-h-screen bg-pure-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-charcoal rounded-[13px] flex items-center justify-center mx-auto mb-4">
          <span className="text-pure-white font-bold text-lg">C</span>
        </div>
        <p className="text-olive-slate animate-pulse">Loading...</p>
      </div>
    </div>
  )
}
