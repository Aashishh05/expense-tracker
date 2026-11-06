import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { forgotPasswordApi } from '@/api/auth';
import { Button } from '@/components/ui/Button';

type Values = { email: string };

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ defaultValues: { email: '' } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await forgotPasswordApi(values.email.trim());
      setSent(true);
    } catch {
      toast.error('Could not send the reset request');
    }
  });

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-[400px] animate-fade-rise">
        <div className="mb-6 text-center">
          <h1 className="text-[22px] font-semibold tracking-tight">Forgot password?</h1>
        </div>

        <div className="card p-6">
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-[14px] text-ink">
                If that email is registered, a reset link has been sent. It's valid for{' '}
                <span className="font-medium">15 minutes</span>.
              </p>
              <p className="text-[12.5px] text-ink-3">
                Tip for local development: the link is printed in the{' '}
                <span className="font-medium">server console</span>.
              </p>
            </div>
          ) : (
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
              <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
                Send reset link
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
