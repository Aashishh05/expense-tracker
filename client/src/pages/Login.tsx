import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { WalletIcon, EyeIcon, EyeOffIcon } from '@/components/icons';
import { apiFieldErrors, apiMessage } from '@/utils/format';

type LoginValues = { email: string; password: string };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ defaultValues: { email: '', password: '' } });

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.email.trim(), values.password);
      toast.success(`Welcome back!`);
      navigate(from, { replace: true });
    } catch (err) {
      const message = apiMessage(err, 'Could not sign in');
      toast.error(message);
      const fieldErrors = apiFieldErrors(err);
      for (const fieldError of fieldErrors) {
        setError(fieldError.field as keyof LoginValues, { type: 'server', message: fieldError.msg });
      }
      if (!fieldErrors.length && /email or password/i.test(message)) {
        setError('password', { type: 'server', message: 'Check your email and password' });
      }
    }
  });

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-[400px] animate-fade-rise">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-white shadow-card">
            <WalletIcon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-[14px] text-ink-2">Sign in to your Expense Tracker</p>
          </div>
        </div>

        <div className="card p-6">
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`input ${errors.email ? 'input-error' : ''}`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[\w.+-]+@[\w-]+\.[\w.-]+$/, message: 'Enter a valid email' },
                })}
              />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="pressable absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-3 hover:text-ink"
                >
                  {showPassword ? <EyeOffIcon className="h-4.5 w-4.5" /> : <EyeIcon className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-[14px] text-ink-2">
          New here?{' '}
          <Link to="/register" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
