'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function switchMode(next: Mode) {
    setMode(next)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setEmailSent(false)
  }

  async function handleGoogleAuth() {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
    if (error) {
      toast.error(error.message)
      setGoogleLoading(false)
    }
  }

  async function handleEmailSignIn() {
    if (!email || !password) return toast.error('Please fill in all fields')
    setEmailLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
    } else {
      router.push('/dashboard')
    }
    setEmailLoading(false)
  }

  async function handleEmailSignUp() {
    if (!email || !password) return toast.error('Please fill in all fields')
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    if (password !== confirmPassword) return toast.error('Passwords do not match')
    setEmailLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      toast.error(error.message)
    } else if (data.user && data.session) {
      await supabase.rpc('ensure_default_categories', { uid: data.user.id })
      router.push('/dashboard')
    } else {
      setEmailSent(true)
    }
    setEmailLoading(false)
  }

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#6366F1]/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#6366F1]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6">

          {/* Logo + branding */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 bg-[#6366F1] rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-white font-bold text-2xl">N</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Nova Expenses</h1>
              <p className="text-sm text-muted-foreground mt-1">Your personal expense tracker</p>
            </div>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-2xl">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                  mode === m
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          {/* Email sent confirmation */}
          {emailSent ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Check your inbox</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Click it to activate your account.
                </p>
              </div>
              <Button
                variant="link"
                onClick={() => switchMode('signin')}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              {/* Email / password form */}
              <div className="space-y-3">
                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (mode === 'signin' ? handleEmailSignIn() : handleEmailSignUp())}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && mode === 'signin' && handleEmailSignIn()}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Confirm password (sign up only) */}
                {mode === 'signup' && (
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEmailSignUp()}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                  </div>
                )}

                {/* Submit */}
                <Button
                  size="lg"
                  onClick={mode === 'signin' ? handleEmailSignIn : handleEmailSignUp}
                  disabled={emailLoading}
                  className="w-full"
                >
                  {emailLoading && <Spinner />}
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                </Button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-medium">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Google button */}
              <Button
                variant="outline"
                size="lg"
                onClick={handleGoogleAuth}
                disabled={googleLoading}
                className="w-full gap-3"
              >
                {googleLoading ? (
                  <Spinner />
                ) : (
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </Button>
            </>
          )}

          <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
            By continuing, you agree to our terms of service and privacy policy.
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          Nova Expenses &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
