// app/admin/(protected)/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type UserRow = {
  id: string;
  full_name: string | null;
  email: string
  country: string | null;
  kyc_status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email,  country').eq('role', 'user');
      const { data: kycRows } = await supabase.from('kyc_submissions').select('user_id, status');

      const statusByUser = Object.fromEntries((kycRows ?? []).map((k) => [k.user_id, k.status]));

      setUsers(
        (profiles ?? []).map((p) => ({
          ...p,
          kyc_status: (statusByUser[p.id] as UserRow['kyc_status']) ?? 'not_submitted',
        }))
      );
    };
    load();
  }, []);

  const statusColor = (status: UserRow['kyc_status']) => {
    if (status === 'approved') return 'text-green-500';
    if (status === 'rejected') return 'text-red-500';
    if (status === 'pending') return 'text-amber-500';
    return 'text-neutral-500';
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Users</h1>
      <p className="text-sm text-neutral-500 mb-6">Tap a user to view their full profile and verification.</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>KYC Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.full_name || 'Unnamed user'}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell className={`text-sm font-medium capitalize ${statusColor(u.kyc_status)}`}>
                {u.kyc_status.replace('_', ' ')}
              </TableCell>
              <TableCell>
                <Link href={`/admin/users/${u.id}`} className="text-sm font-medium underline">
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
