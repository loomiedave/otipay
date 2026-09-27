'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Transfer = {
  id: string;
  sender_id: string;
  recipient_name: string;
  recipient_phone: string;
  from_country: string;
  to_country: string;
  amount_sent: number;
  rate_used: number;
  amount_received: number;
  fee: number;
  status: string;
  network: string | null;
  collection_reference: string | null;
  payout_reference: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type SenderProfile = {
  full_name: string | null;
  phone: string | null;
  email: string | null;
};

export default function AdminTransferDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [sender, setSender] = useState<SenderProfile | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = async () => {
    const { data: t } = await supabase
      .from('transfers')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!t) return;
    setTransfer(t as Transfer);

    const { data: p } = await supabase
      .from('profiles')
      .select('full_name, phone, email')
      .eq('id', t.sender_id)
      .single();

    if (p) setSender(p as SenderProfile);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`admin_transfer_${params.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transfers', filter: `id=eq.${params.id}` },
        load,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleConfirm = async () => {
    if (!transfer) return;
    setConfirming(true);
    setActionError(null);

    const { data: userData } = await supabase.auth.getUser();
    const reviewerId = userData?.user?.id;
    if (!reviewerId) {
      setActionError('Could not determine current admin user.');
      setConfirming(false);
      return;
    }

    const { data, error } = await supabase.functions.invoke('verify-and-payout', {
      body: { transferId: transfer.id, reviewerId },
    });

    setConfirming(false);

    if (error) {
      setActionError(error.message ?? 'Payout call failed.');
      return;
    }
    if (data?.error) {
      setActionError(data.error);
      return;
    }
    // Realtime subscription will pick up the row update, but refresh just in case.
    load();
  };

  if (!transfer) {
    return <div className="text-sm text-neutral-500">Loading…</div>;
  }

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.push('/admin/transfers')}
        className="text-sm text-neutral-500 underline mb-4"
      >
        ← Back to transfers
      </button>

      <h1 className="text-xl font-semibold mb-1">Transfer review</h1>
      <p className="text-sm text-neutral-500 mb-6">{transfer.id}</p>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mb-8">
        <Field label="Status" value={transfer.status.replace('_', ' ')} />
        <Field label="Route" value={`${transfer.from_country} → ${transfer.to_country}`} />
        <Field label="Network" value={(transfer.network ?? '—').toUpperCase()} />
        <Field label="Submitted" value={new Date(transfer.created_at).toLocaleString()} />

        <Field label="Recipient" value={transfer.recipient_name} />
        <Field label="Recipient phone" value={transfer.recipient_phone} />

        <Field label="Sender" value={sender?.full_name ?? '—'} />
        <Field label="Sender phone" value={sender?.phone ?? '—'} />
        <Field label="Sender email" value={sender?.email ?? '—'} />

        <Field label="Amount sent" value={String(transfer.amount_sent)} />
        <Field label="Fee" value={String(transfer.fee)} />
        <Field label="Rate used" value={String(transfer.rate_used)} />
        <Field label="Amount to receive" value={String(transfer.amount_received)} />

        <Field label="Collection reference" value={transfer.collection_reference ?? '—'} mono />
        <Field label="Payout reference" value={transfer.payout_reference ?? '—'} mono />

        {transfer.reviewed_at && (
          <Field label="Reviewed at" value={new Date(transfer.reviewed_at).toLocaleString()} />
        )}
      </div>

      {transfer.status === 'pending_verification' && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="bg-neutral-900 text-white text-sm font-medium px-4 py-2 rounded disabled:opacity-50"
          >
            {confirming ? 'Confirming & paying out…' : 'Confirm & pay out'}
          </button>
        </div>
      )}

      {transfer.status === 'failed' && (
        <p className="text-sm text-red-500">
          Payout failed — see payout reference above for the error detail.
        </p>
      )}

      {transfer.status === 'paid_out' && (
        <p className="text-sm text-emerald-600">Paid out successfully.</p>
      )}

      {actionError && <p className="text-sm text-red-500 mt-3">{actionError}</p>}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-neutral-400 mb-0.5">{label}</div>
      <div className={mono ? 'font-mono text-xs break-all' : ''}>{value}</div>
    </div>
  );
}
