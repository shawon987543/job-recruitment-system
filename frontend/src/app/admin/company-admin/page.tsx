'use client';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import { apiRequest } from '../../../lib/api';

type CompanyAdmin = {
  id: number;
  name: string;
  email: string;
  role: 'COMPANY_ADMIN';
  isActive: boolean;
  mustChangePassword: boolean;
  companyId: number | null;
  createdAt?: string;
  updatedAt?: string;
};

type AdminForm = {
  name: string;
  email: string;
};

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export default function CompanyAdminsPage() {
  const [admins, setAdmins] = useState<CompanyAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const [selectedAdmin, setSelectedAdmin] =
    useState<CompanyAdmin | null>(null);

  const [form, setForm] = useState<AdminForm>({
    name: '',
    email: '',
  });

  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] =
    useState<number | null>(null);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiRequest('/users/company-admins');

      const adminList = Array.isArray(response)
        ? response
        : Array.isArray(response?.users)
          ? response.users
          : [];

      setAdmins(adminList);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load Company Admin accounts.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAdmins();
  }, [fetchAdmins]);

  const filteredAdmins = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return admins.filter((admin) => {
      const matchesSearch =
        admin.name.toLowerCase().includes(searchValue) ||
        admin.email.toLowerCase().includes(searchValue) ||
        String(admin.companyId ?? '').includes(searchValue);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && admin.isActive) ||
        (statusFilter === 'INACTIVE' && !admin.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [admins, search, statusFilter]);

  const activeCount = admins.filter((admin) => admin.isActive).length;
  const inactiveCount = admins.length - activeCount;
  const passwordChangeCount = admins.filter(
    (admin) => admin.mustChangePassword,
  ).length;

  const openEditModal = (admin: CompanyAdmin) => {
    setSelectedAdmin(admin);
    setForm({
      name: admin.name,
      email: admin.email,
    });
    setError('');
    setSuccess('');
  };

  const closeEditModal = () => {
    if (saving) return;

    setSelectedAdmin(null);
    setForm({ name: '', email: '' });
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedAdmin) return;

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name || !email) {
      setError('Name and email are required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await apiRequest(`/users/${selectedAdmin.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, email }),
      });

      setSelectedAdmin(null);
      setSuccess('Company Admin updated successfully.');

      await fetchAdmins();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update Company Admin.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (admin: CompanyAdmin) => {
    const action = admin.isActive ? 'deactivate' : 'activate';

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${admin.name}'s account?`,
    );

    if (!confirmed) return;

    try {
      setUpdatingStatusId(admin.id);
      setError('');
      setSuccess('');

      await apiRequest(`/users/${admin.id}/active-status`, {
        method: 'PATCH',
        body: JSON.stringify({
          isActive: !admin.isActive,
        }),
      });

      setSuccess(
        `${admin.name}'s account has been ${
          admin.isActive ? 'deactivated' : 'activated'
        } successfully.`,
      );

      await fetchAdmins();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${action} Company Admin.`,
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '—';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return '—';

    return parsedDate.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');

  return (
    <main className="min-h-screen bg-[#f4f7fb] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#101d3b] via-[#17356b] to-[#2563a9] p-6 text-white shadow-xl shadow-blue-950/10 sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-35 border-white/5" />
          <div className="pointer-events-none absolute -bottom-32 right-40 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

          <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-100">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                SUPER ADMIN CONTROL PANEL
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Company Admins
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                Manage administrator accounts, monitor account status,
                and control company access from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchAdmins()}
              disabled={loading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-lg">↻</span>
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </section>

        {/* Notifications */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span className="text-lg">⚠️</span>
            <div>{error}</div>
            <button
              type="button"
              onClick={() => setError('')}
              className="ml-auto font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <span className="text-lg">✓</span>
            <div>{success}</div>
            <button
              type="button"
              onClick={() => setSuccess('')}
              className="ml-auto font-bold"
              aria-label="Dismiss success"
            >
              ×
            </button>
          </div>
        )}

        {/* Statistics */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Account Overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                A quick summary of administrator accounts.
              </p>
            </div>
            <span className="hidden rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm sm:inline-flex">
              Live account data
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Admins"
              value={admins.length}
              description="All company administrators"
              icon="👥"
              accent="blue"
              loading={loading}
            />

            <StatCard
              title="Active Admins"
              value={activeCount}
              description="Currently active accounts"
              icon="✓"
              accent="green"
              loading={loading}
            />

            <StatCard
              title="Inactive Admins"
              value={inactiveCount}
              description="Deactivated accounts"
              icon="⏸"
              accent="red"
              loading={loading}
            />

            <StatCard
              title="Password Pending"
              value={passwordChangeCount}
              description="Must change temporary password"
              icon="🔐"
              accent="amber"
              loading={loading}
            />
          </div>
        </section>

        {/* Main table */}
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Administrator Directory
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  View and manage all registered Company Admin accounts.
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                {filteredAdmins.length} of {admins.length} accounts
              </div>
            </div>

            {/* Search and filter */}
            <div className="mt-6 flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                  ⌕
                </span>

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email, or company ID..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="min-w-44 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              <p className="mt-4 text-sm font-medium text-slate-500">
                Loading administrator accounts...
              </p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                👥
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-800">
                No Company Admins found
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                {admins.length === 0
                  ? 'There are no Company Admin accounts yet.'
                  : 'Try changing your search or status filter to find an account.'}
              </p>
              {(search || statusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('ALL');
                  }}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-237.5 text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4 font-bold">Administrator</th>
                    <th className="px-5 py-4 font-bold">Company</th>
                    <th className="px-5 py-4 font-bold">Account Status</th>
                    <th className="px-5 py-4 font-bold">Password</th>
                    <th className="px-5 py-4 font-bold">Joined Date</th>
                    <th className="px-6 py-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredAdmins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="transition hover:bg-blue-50/30"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-200">
                            {getInitials(admin.name) || 'A'}
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-slate-800">
                              {admin.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {admin.email}
                            </p>
                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              ID #{admin.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
                          <span className="text-blue-600">▦</span>
                          <span className="font-semibold text-slate-700">
                            {admin.companyId
                              ? `Company #${admin.companyId}`
                              : 'Not assigned'}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                            admin.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              admin.isActive
                                ? 'bg-emerald-500'
                                : 'bg-red-500'
                            }`}
                          />
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            admin.mustChangePassword
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {admin.mustChangePassword
                            ? 'Change required'
                            : 'Updated'}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-xs font-medium text-slate-500">
                        {formatDate(admin.createdAt)}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(admin)}
                            className="rounded-lg border border-blue-200 bg-white px-3.5 py-2 text-xs font-bold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={updatingStatusId === admin.id}
                            onClick={() => void handleStatusChange(admin)}
                            className={`rounded-lg border px-3.5 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              admin.isActive
                                ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                                : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {updatingStatusId === admin.id
                              ? 'Updating...'
                              : admin.isActive
                                ? 'Deactivate'
                                : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && filteredAdmins.length > 0 && (
            <div className="flex flex-col justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center">
              <p>
                Showing <strong>{filteredAdmins.length}</strong> administrator
                account(s)
              </p>
              <p>CareerHub Administration</p>
            </div>
          )}
        </section>
      </div>

      {/* Edit modal */}
      {selectedAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-admin-title"
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="bg-linear-to-r from-[#14264a] to-blue-700 px-6 py-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-200">
                    Account Management
                  </div>
                  <h2
                    id="edit-admin-title"
                    className="text-2xl font-bold"
                  >
                    Edit Administrator
                  </h2>
                  <p className="mt-2 text-sm text-blue-100">
                    Update account information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  aria-label="Close modal"
                  className="rounded-xl bg-white/10 px-3 py-2 text-xl text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5 p-6">
              <div>
                <label
                  htmlFor="admin-name"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Full Name
                </label>
                <input
                  id="admin-name"
                  type="text"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Email Address
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  maxLength={255}
                  value={form.email}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      email: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  placeholder="Enter email address"
                />
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-700">
                  Account Information
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Company ID</p>
                    <p className="mt-1 font-bold text-slate-800">
                      {selectedAdmin.companyId ?? 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Account Role</p>
                    <p className="mt-1 font-bold text-slate-800">
                      Company Admin
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Role and company assignment cannot be changed from this form.
                </p>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
  accent,
  loading,
}: {
  title: string;
  value: number;
  description: string;
  icon: string;
  accent: 'blue' | 'green' | 'red' | 'amber';
  loading: boolean;
}) {
  const styles = {
    blue: {
      icon: 'bg-blue-50 text-blue-600',
      line: 'bg-blue-500',
      label: 'text-blue-600',
    },
    green: {
      icon: 'bg-emerald-50 text-emerald-600',
      line: 'bg-emerald-500',
      label: 'text-emerald-600',
    },
    red: {
      icon: 'bg-red-50 text-red-600',
      line: 'bg-red-500',
      label: 'text-red-600',
    },
    amber: {
      icon: 'bg-amber-50 text-amber-600',
      line: 'bg-amber-500',
      label: 'text-amber-600',
    },
  };

  const style = styles[accent];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>
          <p className={`mt-3 text-3xl font-extrabold tracking-tight text-slate-900 ${style.label}`}>
            {loading ? '—' : value}
          </p>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold ${style.icon}`}>
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>

      <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-100">
        <div className={`h-full w-1/3 rounded-r-full ${style.line}`} />
      </div>
    </div>
  );
}
