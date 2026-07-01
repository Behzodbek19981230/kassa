import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FaSignInAlt } from 'react-icons/fa'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../components/ui'
import { DEFAULT_CREDENTIALS, login } from '../lib/auth'

const loginSchema = z.object({
  email: z.string().min(1, 'Email address is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [remember, setRemember] = useState(false)
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(({ email, password }) => {
    setFormError('')
    try {
      login(email, password, remember)
      const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Login failed')
    }
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-ca-sidebar-dark px-4 py-16">
      <div className="w-full max-w-[450px]">
        <div className="relative mb-5 px-2.5">
          <span
            className="mr-2.5 inline-block h-0 w-0 border-[14px] align-middle opacity-90"
            style={{ borderColor: '#4DCACA #31A3A3 #1D8888' }}
          />
          <span className="align-middle text-[28px] font-light text-white">Color Admin</span>
          <small className="block pl-[38px] text-sm font-light text-white/50">
            responsive bootstrap 3 admin template
          </small>
          <FaSignInAlt className="absolute top-0 right-2.5 text-6xl text-white opacity-10" />
        </div>

        <div className="rounded bg-ca-sidebar px-10 py-8 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          {formError && (
            <div className="mb-5 rounded border border-[#ff8f8c]/40 bg-[#ff8f8c]/10 px-3 py-2 text-xs text-[#ff8f8c]">
              {formError}
            </div>
          )}

          <div className="mb-5 rounded border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/70">
            Demo login — email <strong className="text-white">{DEFAULT_CREDENTIALS.email}</strong>, password{' '}
            <strong className="text-white">{DEFAULT_CREDENTIALS.password}</strong>
          </div>

          <form onSubmit={onSubmit} noValidate>
            <div className="mb-5">
              <input
                type="text"
                placeholder="Email Address"
                autoComplete="username"
                className="h-[46px] w-full rounded-[3px] border-none bg-white/20 px-3 text-sm text-white placeholder-white/60 focus:bg-white/25 focus:outline-none"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-[11px] text-[#ff8f8c]">{errors.email.message}</p>}
            </div>
            <div className="mb-5">
              <input
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                className="h-[46px] w-full rounded-[3px] border-none bg-white/20 px-3 text-sm text-white placeholder-white/60 focus:bg-white/25 focus:outline-none"
                {...register('password')}
              />
              {errors.password && <p className="mt-1 text-[11px] text-[#ff8f8c]">{errors.password.message}</p>}
            </div>
            <label className="mb-5 flex cursor-pointer items-center gap-2 text-xs text-white/80">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded-sm border-white/30 bg-white/20 accent-ca-green"
              />
              Remember Me
            </label>
            <Button type="submit" variant="success" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign me in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
