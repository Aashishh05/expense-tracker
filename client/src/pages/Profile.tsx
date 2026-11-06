import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { KeyRound as KeyIcon, User as UserIcon } from 'lucide-react';
import { CURRENCIES } from '@/utils/constants';
import { apiMessage, cn } from '@/utils/format';

type ProfileValues = { name: string; currency: string };
type PasswordValues = { currentPassword: string; newPassword: string; confirm: string };

export default function Profile() {
  const { user, saveProfile, changePassword, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const profileForm = useForm<ProfileValues>({
    defaultValues: { name: user?.name ?? '', currency: user?.currency ?? 'NPR' },
  });
  const passwordForm = useForm<PasswordValues>({
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  });

  const memberSince = user?.createdAt
    ? new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' }).format(
        new Date(user.createdAt)
      )
    : null;

  const onProfile = profileForm.handleSubmit(async (values) => {
    try {
      await saveProfile({ name: values.name.trim(), currency: values.currency });
      toast.success('Profile updated');
      profileForm.reset(values);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not update the profile'));
    }
  });

  const onPassword = passwordForm.handleSubmit(async (values) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Password changed');
      passwordForm.reset();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not change the password'));
    }
  });

  return (
    <>
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-tight md:text-2xl">Profile</h1>
        <p className="mt-0.5 text-[13.5px] text-ink-2">Your account details and settings</p>
      </header>

      <div className="grid max-w-2xl grid-cols-1 gap-4 md:gap-5">
        {/* Account card */}
        <section className="card p-5">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-[18px] font-semibold text-accent">
              {user?.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]!.toUpperCase())
                .join('')}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-[13.5px] text-ink-2">{user?.email}</p>
              {memberSince && (
                <p className="mt-0.5 text-[12px] text-ink-3">Member since {memberSince}</p>
              )}
            </div>
          </div>
        </section>

        {/* Edit profile */}
        <section className="card p-5 md:p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent">
              <UserIcon className="h-[18px] w-[18px]" />
            </span>
            <h2 className="text-[15.5px] font-semibold">Personal details</h2>
          </div>

          <form onSubmit={onProfile} noValidate className="space-y-4">
            <Input
              label="Name"
              type="text"
              placeholder="Your name"
              error={profileForm.formState.errors.name?.message}
              {...profileForm.register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be 2-50 characters' },
                maxLength: { value: 50, message: 'Name must be 2-50 characters' },
              })}
            />

            <Select
              label="Currency"
              hint="Applies everywhere amounts are shown."
              error={profileForm.formState.errors.currency?.message}
              {...profileForm.register('currency')}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} — {currency.name}
                </option>
              ))}
            </Select>

            <div className="flex justify-end">
              <Button
                type="submit"
                loading={profileForm.formState.isSubmitting}
                disabled={!profileForm.formState.isDirty}
              >
                Save changes
              </Button>
            </div>
          </form>
        </section>

        {/* Password */}
        <section className="card p-5 md:p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent">
              <KeyIcon className="h-[18px] w-[18px]" />
            </span>
            <h2 className="text-[15.5px] font-semibold">Change password</h2>
          </div>

          <form onSubmit={onPassword} noValidate className="space-y-4">
            <Input
              label="Current password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword', { required: 'Enter your current password' })}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="New password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                error={passwordForm.formState.errors.newPassword?.message}
                {...passwordForm.register('newPassword', {
                  required: 'Enter a new password',
                  minLength: { value: 6, message: 'At least 6 characters' },
                })}
              />
              <Input
                label="Confirm new password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                error={passwordForm.formState.errors.confirm?.message}
                {...passwordForm.register('confirm', {
                  required: 'Confirm the new password',
                  validate: (value) =>
                    value === passwordForm.watch('newPassword') || 'Passwords do not match',
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-[13px] font-medium text-accent hover:underline"
              >
                {showPassword ? 'Hide passwords' : 'Show passwords'}
              </button>
              <Button
                type="submit"
                loading={passwordForm.formState.isSubmitting}
                disabled={!passwordForm.formState.isDirty}
              >
                Change password
              </Button>
            </div>
          </form>
        </section>

        {/* Session */}
        <section className={cn('card p-5')}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[15.5px] font-semibold">Session</h2>
              <p className="mt-0.5 text-[13px] text-ink-2">
                Signed in on this browser — sign out to end it.
              </p>
            </div>
            <Button variant="danger" onClick={logout}>
              Log out
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
