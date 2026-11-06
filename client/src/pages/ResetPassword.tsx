import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { resetPasswordApi } from '@/api/auth';
import { Button } from '@/components/ui/Button';

type Values = { password: string; confirm: string };

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [invalid, setInvalid] = useState(!/^[0-9a-f]{64}$/.test(token));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ defaultValues: { password: '', confirm: '' } });

  useEffect(() => {
    if (invalid) setInvalid(true);
  }, [invalid]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await resetPasswordApi(token, values.password);
      toast.success('Password updated — sign in with your new password');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error('This reset link is invalid or has expired — request a new one');
      setInvalid(true);
    }
  });

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-[400px] animate-fade-rise">
        <div className="mb-6 text-center">
          <h1 className="text-[22px] font-semibold tracking-tight">Set a new password</h1>
        </div>

        <div className="card p-6">
          {invalid ? (
            <div className="space-y-4 text-center">
              <p className="text-[14px] text-ink">This reset link is invalid or has expired.</p>
              <Link to="/forgot-password">
                <Button variant="secondary" className="w-full">
                  Request a new link
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <div>
                <label className="label" htmlFor="password">
                  New password
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
                    validate: (value, formValues) => value === formValues.password || 'The passwords do not match',
                  })}
                />
                {errors.confirm && <p className="error-text">{errors.confirm.message}</p>}
              </div>
              <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
                Update password
              </Button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-[14px] text-ink-2">
          Back to{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
