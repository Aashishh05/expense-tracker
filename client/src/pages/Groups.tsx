import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import {
  addGroupMember,
  createGroup,
  deleteGroup,
  getGroup,
  getGroupStats,
  listGroupTransactions,
  listGroups,
  renameGroup,
} from '@/api/groups';
import type { Group, GroupStats, Pagination, Transaction } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { RateNote } from '@/components/ui/RateNote';
import { Button, IconButton } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination as PaginationBar } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Loader';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { ReceiptViewer } from '@/components/transactions/ReceiptViewer';
import { PlusIcon, UsersIcon, ChevronLeftIcon, PencilIcon, TrashIcon } from '@/components/icons';
import { apiMessage, cn, formatCurrency, formatDate } from '@/utils/format';

const PAGE_LIMIT = 20;

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Groups() {
  const { id } = useParams();

  if (id) return <GroupDetail groupId={id} />;
  return <GroupList />;
}

/* ---------------------------------- list ---------------------------------- */

function GroupList() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await listGroups();
      setGroups(response.data);
      setError(null);
    } catch (err) {
      setError(apiMessage(err, 'Could not load groups'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight md:text-2xl">Groups</h1>
          <p className="mt-0.5 text-[13.5px] text-ink-2">
            Bills, trips and rent shared with friends — balanced automatically
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <PlusIcon className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">New group</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </header>
      <RateNote className="-mt-3.5 mb-5" />

      {loading ? (
        <div className="space-y-3" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[84px] rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <EmptyState icon={<UsersIcon className="h-6 w-6" />} title="Couldn't load groups" description={error} />
        </div>
      ) : groups.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<UsersIcon className="h-6 w-6" />}
            title="No groups yet"
            description="Create a group, invite people who already have an account, and log shared expenses together."
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {groups.map((group) => (
            <li key={group._id}>
              <button
                onClick={() => navigate(`/groups/${group._id}`)}
                className="card pressable flex w-full items-center gap-3 p-3.5 text-left"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <UsersIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-medium text-ink">{group.name}</p>
                  <p className="truncate text-[12.5px] text-ink-2">
                    {group.members.length} {group.members.length === 1 ? 'member' : 'members'} · since{' '}
                    {formatDate(group.createdAt)}
                  </p>
                </div>
                <div className="hidden items-center sm:flex">
                  {group.members.slice(0, 4).map((member, index) => (
                    <span
                      key={member.user._id}
                      title={member.user.name}
                      className="-ml-1.5 grid h-7 w-7 place-items-center rounded-full border-2 border-surface bg-accent-soft text-[10.5px] font-semibold text-accent first:ml-0"
                      style={{ zIndex: 5 - index }}
                    >
                      {initials(member.user.name)}
                    </span>
                  ))}
                  {group.members.length > 4 && (
                    <span className="-ml-1.5 grid h-7 w-7 place-items-center rounded-full border-2 border-surface bg-ink/[0.05] text-[10.5px] font-semibold text-ink-2">
                      +{group.members.length - 4}
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <GroupNameModal
        open={formOpen}
        title="New group"
        subtitle="You'll be the owner and can invite members after creating it."
        onClose={() => setFormOpen(false)}
        onSubmit={async (name) => {
          const response = await createGroup(name);
          toast.success('Group created');
          return response.data._id;
        }}
        onDone={(groupId) => {
          setFormOpen(false);
          if (groupId) navigate(`/groups/${groupId}`);
          else void load();
        }}
      />
    </>
  );
}

/* --------------------------------- detail --------------------------------- */

function GroupDetail({ groupId }: { groupId: string }) {
  const { user } = useAuth();
  const currency = user?.currency ?? 'NPR';
  const navigate = useNavigate();
  const { categories } = useCategories();

  const [group, setGroup] = useState<Group | null>(null);
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<Transaction | null>(null);

  const [memberEmail, setMemberEmail] = useState('');
  const [memberBusy, setMemberBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [groupRes, statsRes, txnsRes] = await Promise.all([
        getGroup(groupId),
        getGroupStats(groupId),
        listGroupTransactions(groupId, { page, limit: PAGE_LIMIT }),
      ]);
      setGroup(groupRes.data);
      setStats(statsRes.data);
      setTransactions(txnsRes.data);
      setPagination(txnsRes.pagination ?? null);
      setError(null);
    } catch (err) {
      setError(apiMessage(err, 'Could not load the group'));
    } finally {
      setLoading(false);
    }
  }, [groupId, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const isOwner = Boolean(group && user && group.owner === user._id);

  const submitMember = async () => {
    if (!group) return;
    const email = memberEmail.trim();
    if (!email) return;
    setMemberBusy(true);
    try {
      const response = await addGroupMember(group._id, email);
      setGroup(response.data);
      setMemberEmail('');
      toast.success('Member added');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not add that member'));
    } finally {
      setMemberBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!group) return;
    setDeletePending(true);
    try {
      await deleteGroup(group._id);
      toast.success('Group deleted — its transactions were kept as personal entries');
      navigate('/groups');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not delete the group'));
      setDeletePending(false);
      setDeleteOpen(false);
    }
  };

  const me = stats?.members.find((member) => member.user._id === user?._id);

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <IconButton label="Back to groups" onClick={() => navigate('/groups')}>
            <ChevronLeftIcon className="h-4.5 w-4.5" />
          </IconButton>
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-semibold tracking-tight md:text-2xl">
              {group?.name ?? 'Group'}
            </h1>
            <p className="mt-0.5 text-[13.5px] text-ink-2">Shared expenses, split equally</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {group && isOwner && (
            <>
              <IconButton label="Rename group" onClick={() => setRenameOpen(true)}>
                <PencilIcon className="h-4.5 w-4.5" />
              </IconButton>
              <IconButton label="Delete group" tone="danger" onClick={() => setDeleteOpen(true)}>
                <TrashIcon className="h-4.5 w-4.5" />
              </IconButton>
            </>
          )}
          <Button onClick={() => setFormOpen(true)}>
            <PlusIcon className="h-4.5 w-4.5" />
            <span className="hidden sm:inline">Add expense</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </header>
      <RateNote className="-mt-3.5 mb-5" />

      {loading ? (
        <div className="space-y-4" aria-hidden="true">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : error || !group ? (
        <div className="card">
          <EmptyState
            icon={<UsersIcon className="h-6 w-6" />}
            title="Couldn't load this group"
            description={error ?? 'It may no longer exist.'}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Members card */}
          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              {group.members.map((member) => (
                <span
                  key={member.user._id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink/[0.05] py-1 pl-1.5 pr-3 text-[13px] font-medium text-ink"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent-soft text-[10.5px] font-semibold text-accent">
                    {initials(member.user.name)}
                  </span>
                  {member.user.name}
                  {member.role === 'owner' && <span className="text-[11px] font-normal text-ink-3">owner</span>}
                </span>
              ))}
            </div>
            {isOwner && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submitMember();
                }}
                className="mt-3 flex flex-wrap gap-2"
              >
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="Invite by email (they need an account)"
                  className="input h-10 max-w-[320px] flex-1"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="md"
                  loading={memberBusy}
                  disabled={group.members.length >= 12}
                >
                  Add member
                </Button>
              </form>
            )}
          </div>

          {/* Summary strip */}
          {stats && (
            <div className="card grid grid-cols-2 divide-y divide-line sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              <StatCell label="Total spent" value={formatCurrency(stats.total, currency)} />
              <StatCell label="I paid" value={formatCurrency(me?.paid ?? 0, currency)} />
              <StatCell label="My share" value={formatCurrency(me?.share ?? 0, currency)} />
              <StatCell
                label="My net"
                value={(me && me.net > 0 ? '+' : me && me.net < 0 ? '−' : '') + formatCurrency(Math.abs(me?.net ?? 0), currency)}
                tone={me ? me.net > 0.005 ? 'plus' : me.net < -0.005 ? 'minus' : undefined : undefined}
              />
            </div>
          )}

          {/* Member balances */}
          {stats && stats.members.length > 0 && (
            <div className="card overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-line text-[12.5px] font-medium text-ink-2">
                    <th className="px-4 py-2.5 font-medium">Member</th>
                    <th className="px-4 py-2.5 text-right font-medium">Paid</th>
                    <th className="px-4 py-2.5 text-right font-medium">Share</th>
                    <th className="px-4 py-2.5 text-right font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.members.map((member) => (
                    <tr key={member.user._id} className="border-b border-line/70 last:border-0">
                      <td className="px-4 py-2.5 text-[13.5px] font-medium text-ink">
                        {member.user.name}
                        {member.role === 'owner' && <span className="ml-1.5 text-[11px] text-ink-3">owner</span>}
                      </td>
                      <td className="nums px-4 py-2.5 text-right text-[13.5px] text-ink-2">
                        {formatCurrency(member.paid, currency)}
                      </td>
                      <td className="nums px-4 py-2.5 text-right text-[13.5px] text-ink-2">
                        {formatCurrency(member.share, currency)}
                      </td>
                      <td
                        className={cn(
                          'nums px-4 py-2.5 text-right text-[13.5px] font-medium',
                          member.net > 0.005 ? 'text-income' : member.net < -0.005 ? 'text-expense' : 'text-ink'
                        )}
                      >
                        {member.net > 0.005 ? '+' : member.net < -0.005 ? '−' : ''}
                        {formatCurrency(Math.abs(member.net), currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Settle-up */}
          {stats && (
            <div className="card p-4">
              <p className="mb-2 text-[13.5px] font-medium text-ink">Settle up</p>
              {stats.settle.length === 0 ? (
                <p className="text-[13.5px] text-ink-2">All square — nobody owes anything.</p>
              ) : (
                <ul className="space-y-1.5">
                  {stats.settle.map((transfer, index) => (
                    <li key={index} className="text-[13.5px] text-ink-2">
                      <span className="font-medium text-ink">{transfer.from.name}</span> pays{' '}
                      <span className="font-medium text-ink">{transfer.to.name}</span>{' '}
                      <span className="nums font-medium text-ink">{formatCurrency(transfer.amount, currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Shared expense feed */}
          <div className="card overflow-hidden">
            <TransactionList
              data={transactions}
              currency={currency}
              onEdit={() => undefined}
              onDelete={() => undefined}
              onViewReceipt={setViewingReceipt}
              showActions={false}
              showPayer
            />
            {transactions.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-[14px] font-medium text-ink">No shared expenses yet</p>
                <p className="mt-1 text-[13px] text-ink-2">
                  Use "Add expense" — everything shown here splits equally among members.
                </p>
              </div>
            )}
          </div>

          {pagination && transactions.length > 0 && (
            <PaginationBar pagination={pagination} onChange={setPage} />
          )}
        </div>
      )}

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => void load()}
        transaction={null}
        categories={categories}
        currency={currency}
        group={group ? { _id: group._id, name: group.name } : null}
      />

      <GroupNameModal
        open={renameOpen}
        title="Rename group"
        initialName={group?.name ?? ''}
        onClose={() => setRenameOpen(false)}
        onSubmit={async (name) => {
          if (!group) return null;
          const response = await renameGroup(group._id, name);
          setGroup(response.data);
          toast.success('Group renamed');
          return null;
        }}
        onDone={() => setRenameOpen(false)}
      />

      <ReceiptViewer transaction={viewingReceipt} onClose={() => setViewingReceipt(null)} />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this group?"
        message="Every member loses access. Its transactions are kept as personal expenses of whoever logged them."
        loading={deletePending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
}

/* -------------------------------- helpers --------------------------------- */

function StatCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'plus' | 'minus';
}) {
  return (
    <div className="px-4 py-3.5">
      <p className="text-[12.5px] text-ink-2">{label}</p>
      <p
        className={cn(
          'nums mt-0.5 text-[17px] font-semibold',
          tone === 'plus' && 'text-income',
          tone === 'minus' && 'text-expense',
          !tone && 'text-ink'
        )}
      >
        {value}
      </p>
    </div>
  );
}

interface GroupNameModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  initialName?: string;
  onClose: () => void;
  /** Returns the new group's id when creating, or null when renaming. */
  onSubmit: (name: string) => Promise<string | null>;
  onDone: (groupId: string | null) => void;
}

function GroupNameModal({ open, title, subtitle, initialName = '', onClose, onSubmit, onDone }: GroupNameModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ name: string }>({ defaultValues: { name: '' } });

  useEffect(() => {
    if (open) reset({ name: initialName });
  }, [open, initialName, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      const groupId = await onSubmit(values.name.trim());
      onDone(groupId ?? null);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save the group'));
      setError('name', { type: 'server', message: 'Check the name and try again' });
    }
  });

  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle} maxWidth="24rem">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Input
          label="Group name"
          placeholder="e.g. Trek trip"
          autoFocus
          error={errors.name?.message}
          {...register('name', {
            required: 'Name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' },
            maxLength: { value: 60, message: 'Name must be at most 60 characters' },
          })}
        />
        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="md" loading={isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
