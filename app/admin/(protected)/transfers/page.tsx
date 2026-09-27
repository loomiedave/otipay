'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type TransferRow = {
  id: string;
  recipient_name: string;
  from_country: string;
  to_country: string;
  network: string | null;
  amount_sent: number;
  amount_received: number;
  status: string;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending_verification: 'text-amber-500',
  confirmed: 'text-blue-500',
  paid_out: 'text-emerald-500',
  failed: 'text-red-500',
};

export default function AdminTransfersPage() {
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [filter, setFilter] = useState<string>('pending_verification');
  const supabase = createClient();

  const load = async () => {
    let query = supabase
      .from('transfers')
      .select('id, recipient_name, from_country, to_country, network, amount_sent, amount_received, status, created_at')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    if (data) setTransfers(data as TransferRow[]);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('admin_transfers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transfers' }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const filters = [
    { key: 'pending_verification', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'paid_out', label: 'Paid out' },
    { key: 'failed', label: 'Failed' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Transfers</h1>
      <p className="text-sm text-neutral-500 mb-4">Review submitted transfers and trigger payout.</p>

      <div className="flex gap-4 mb-6 border-b">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-sm pb-2 -mb-px border-b-2 ${
              filter === f.key
                ? 'border-neutral-900 font-medium'
                : 'border-transparent text-neutral-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recipient</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Network</TableHead>
            <TableHead>Amount sent</TableHead>
            <TableHead>Amount received</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium">{t.recipient_name}</TableCell>
              <TableCell className="text-sm text-neutral-500">
                {t.from_country} → {t.to_country}
              </TableCell>
              <TableCell className="text-sm text-neutral-500 uppercase">{t.network ?? '—'}</TableCell>
              <TableCell>{t.amount_sent}</TableCell>
              <TableCell>{t.amount_received}</TableCell>
              <TableCell>
                <span className={`text-xs font-semibold ${STATUS_STYLES[t.status] ?? ''}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </TableCell>
              <TableCell className="text-sm text-neutral-500">
                {new Date(t.created_at).toLocaleString()}
              </TableCell>
              <TableCell>
                <Link href={`/admin/transfers/${t.id}`} className="text-sm font-medium underline">
                  Review
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {transfers.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-sm text-neutral-500 py-8">
                No transfers in this view.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
