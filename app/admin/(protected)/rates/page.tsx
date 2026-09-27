'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type RateRow = {
  id: string;
  from_country: string;
  to_country: string;
  rate: number;
  fee: number;
  is_active: boolean;
  updated_at: string;
  updated_by: string | null;
  updated_by_name?: string;
};

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RatesPage() {
  const [rows, setRows] = useState<RateRow[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [countryNames, setCountryNames] = useState<Record<string, string>>({});
  const supabase = createClient();

  const loadRows = async () => {
    const { data: rates } = await supabase
      .from('exchange_rates')
      .select('id, from_country, to_country, rate, fee, is_active, updated_at, updated_by')
      .order('from_country');

    if (!rates) return;

    // New: pull full country names so the table can show them instead of codes
    const { data: countries } = await supabase.from('countries').select('code, name');
    const countryNames: Record<string, string> = Object.fromEntries(
      (countries ?? []).map((c) => [c.code, c.name])
    );

    const updaterIds = [...new Set(rates.map((r) => r.updated_by).filter(Boolean))] as string[];
    let namesById: Record<string, string> = {};

    if (updaterIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', updaterIds);
      namesById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name || 'Admin']));
    }

    setRows(rates.map((r) => ({ ...r, updated_by_name: r.updated_by ? namesById[r.updated_by] : undefined })));
    setCountryNames(countryNames); // new state, added below
  };

  useEffect(() => {
    loadRows();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  const updateField = (id: string, field: 'rate' | 'fee', rawValue: string) => {
    const parsed = rawValue === '' ? 0 : parseFloat(rawValue);
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: Number.isNaN(parsed) ? r[field] : parsed } : r))
    );
  };

  const saveRow = async (row: RateRow) => {
    setSavingId(row.id);
    await supabase
      .from('exchange_rates')
      .update({
        rate: row.rate,
        fee: row.fee,
        updated_at: new Date().toISOString(),
        updated_by: currentUserId,
      })
      .eq('id', row.id);
    await loadRows();
    setSavingId(null);
  };

  const toggleActive = async (row: RateRow) => {
    await supabase
      .from('exchange_rates')
      .update({ is_active: !row.is_active, updated_at: new Date().toISOString(), updated_by: currentUserId })
      .eq('id', row.id);
    await loadRows();
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Rates & Fees</h1>
      <p className="text-sm text-neutral-500 mb-6">Changes go live immediately.</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Corridor</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Last updated</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">
                {countryNames[row.from_country] ?? row.from_country} → {countryNames[row.to_country] ?? row.to_country}
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.0001"
                  value={row.rate}
                  onChange={(e) => updateField(row.id, 'rate', e.target.value)}
                  className="w-28"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={row.fee}
                  onChange={(e) => updateField(row.id, 'fee', e.target.value)}
                  className="w-24"
                />
              </TableCell>
              <TableCell>
                <Button size="sm" variant={row.is_active ? 'default' : 'outline'} onClick={() => toggleActive(row)}>
                  {row.is_active ? 'Live' : 'Off'}
                </Button>
              </TableCell>
              <TableCell className="text-sm text-neutral-500">
                {timeAgo(row.updated_at)}
                {row.updated_by_name && (
                  <span className="block text-xs text-neutral-600">by {row.updated_by_name}</span>
                )}
              </TableCell>
              <TableCell>
                <Button size="sm" onClick={() => saveRow(row)} disabled={savingId === row.id}>
                  {savingId === row.id ? 'Saving…' : 'Save'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
