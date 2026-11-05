import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { WalletIcon } from '@/components/icons';
import { apiFieldErrors, apiMessage } from '@/utils/format';

type RegisterValues = { name: string; email: string; password: string; confirm: string };

export default function Register() {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ defaultValues: { name: '', email: '', password: '', confirm: '' } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signUp({ name: values.name.trim(), email: values.email.trim(), password: values.password });
      toast.success('Account created — welcome!');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(apiMessage(err, 'Could not create the account'));
      for (const fieldError of apiFieldErrors(err)) {
        if (fieldError.field === 'name') setError('name', { type: 'server', message: fieldError.msg });
        if (fieldError.field === 'email') setError('email', { type: 'server', message: fieldError.msg });
        if (fieldError.field === 'password') setError('password', { type: 'server', message: fieldError.msg });
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
            <h1 className="text-[22px] font-semibold tracking-tight">Create your account</h1>
            <p className="mt-1 text-[14px] text-ink-2">
              Start tracking income and expenses in a minute
            </p>
          </div>
        </div>

        <div className="card p-6">
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div>
              <label className="label" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Aashish Shrestha"
                className={`input ${errors.name ? 'input-error' : ''}`}
                {...register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Name must be 2-50 characters' },
                  maxLength: { value: 50, message: 'Name must be 2-50 characters' },
                })}
              />
              {errors.name && <p className="error-text">{errors.name.message}</p>}
            </div>

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
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className={`input ${errors.password ? 'input-error' : ''}`}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
              />
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="confirm">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat the password"
                className={`input ${errors.confirm ? 'input-error' : ''}`}
                {...register('confirm', {
                  required: 'Please confirm the password',
                  validate: (value) => value === watch('password') || 'Passwords do not match',
                })}
              />
              {errors.confirm && <p className="error-text">{errors.confirm.message}</p>}
            </div>

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              Create account
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-[14px] text-ink-2">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
