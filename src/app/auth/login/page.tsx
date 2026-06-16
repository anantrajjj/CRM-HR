'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-pure-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-forest-depths rounded-[11px] flex items-center justify-center">
              <span className="text-mint-sprout font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-2xl text-charcoal tracking-tight">
              CRM<span className="text-olive-slate">+</span>HR
            </span>
          </Link>

          {/* Header */}
          <h1 className="text-3xl font-bold text-charcoal mb-2">Welcome Back!</h1>
          <p className="text-olive-slate mb-8">
            Sign in to access your dashboard and continue
            <br />
            managing your business operations.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[9px] text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-charcoal mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-pebble" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 pl-11 pr-4 border border-sage-mist rounded-[13px] bg-pure-white text-charcoal placeholder:text-pebble focus:outline-none focus:ring-2 focus:ring-forest-depths/20 focus:border-forest-depths transition-all"
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-charcoal mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-pebble" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 pl-11 pr-12 border border-sage-mist rounded-[13px] bg-pure-white text-charcoal placeholder:text-pebble focus:outline-none focus:ring-2 focus:ring-forest-depths/20 focus:border-forest-depths transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-pebble hover:text-charcoal transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-right mt-2">
                <Link href="#" className="text-sm text-forest-depths hover:underline font-medium">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-forest-depths hover:bg-forest-depths/90 text-pure-white rounded-[13px] font-semibold text-base mt-2"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-sage-mist" />
            <span className="text-sm text-pebble font-medium">OR</span>
            <div className="flex-1 h-px bg-sage-mist" />
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 h-12 border border-sage-mist rounded-[13px] bg-pure-white hover:bg-bone transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="font-medium text-charcoal">Continue with Google</span>
            </button>
          </div>

          {/* Sign Up */}
          <p className="mt-8 text-center text-sm text-olive-slate">
            Don&apos;t have an Account?{' '}
            <Link href="/auth/signup" className="text-forest-depths font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Branding Panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-forest-depths via-[#004d2a] to-[#002a16] relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-mint-sprout/30 blur-3xl" />
          <div className="absolute bottom-32 right-16 w-96 h-96 rounded-full bg-mint-sprout/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-sky-wash/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 py-16 text-pure-white">
          {/* Headline */}
          <h2 className="text-5xl font-bold leading-tight mb-8">
            Grow Your Business
            <br />
            with Smarter
            <br />
            CRM & HR
          </h2>

          {/* Testimonial */}
          <div className="mt-8">
            <div className="text-5xl text-mint-sprout/60 font-serif leading-none mb-4">&ldquo;</div>
            <p className="text-lg text-pure-white/90 leading-relaxed max-w-lg">
              CRM+HR has completely transformed how we manage our sales pipeline and people operations.
              It&apos;s reliable, efficient, and ensures our teams are always aligned and productive.
            </p>
            <div className="flex items-center gap-4 mt-8">
              <div className="w-12 h-12 rounded-full bg-mint-sprout/20 flex items-center justify-center text-mint-sprout font-bold text-lg">
                RS
              </div>
              <div>
                <p className="font-semibold text-pure-white">Rajesh Sharma</p>
                <p className="text-sm text-pure-white/60">VP Operations at TCS</p>
              </div>
            </div>
          </div>

          {/* Trust Logos */}
          <div className="mt-auto pt-16">
            <p className="text-xs font-semibold text-pure-white/40 tracking-widest uppercase mb-6">
              Trusted by 500+ Companies
            </p>
            <div className="flex items-center gap-8 text-pure-white/30">
              <span className="text-lg font-bold tracking-tight">Infosys</span>
              <span className="text-lg font-bold tracking-tight">Wipro</span>
              <span className="text-lg font-bold tracking-tight">HDFC</span>
              <span className="text-lg font-bold tracking-tight">Reliance</span>
              <span className="text-lg font-bold tracking-tight">Airtel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
