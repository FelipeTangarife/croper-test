import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { TOO_MANY_REQUESTS_MESSAGE } from '@/lib/rate-limit-interceptor'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useLogin } from '../hooks/use-login'
import { loginSchema, type LoginFormValues } from '../schemas/login.schema'
import { useAuthStore } from '../store/auth.store'

const SESSION_EXPIRED_MESSAGE = 'Tu sesión expiró, vuelve a ingresar'

const getLoginErrorMessage = (error: unknown) => {
  if (!isAxiosError(error)) return 'No se pudo iniciar sesión. Intenta de nuevo.'
  if (!error.response) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.'
  }
  if (error.response.status === 401) return 'Credenciales inválidas'
  if (error.response.status === 429) return TOO_MANY_REQUESTS_MESSAGE
  return 'No se pudo iniciar sesión. Intenta de nuevo.'
}

export function LoginPage() {
  const logoutReason = useAuthStore((state) => state.logoutReason)
  const login = useLogin()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      await login.mutateAsync(values)
    } catch (error) {
      setSubmitError(getLoginErrorMessage(error))
    }
  })

  const message =
    submitError ?? (logoutReason === 'expired' ? SESSION_EXPIRED_MESSAGE : null)

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa con tu cuenta de administrador.
          </p>
        </div>

        {message && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {message}
          </p>
        )}

        <form noValidate onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
            {errors.password && (
              <p id="password-error" className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2Icon className="animate-spin" />}
            {isSubmitting ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
      </div>
    </main>
  )
}
