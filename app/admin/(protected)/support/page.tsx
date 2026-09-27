'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ThreadSummary = {
  user_id: string;
  full_name: string;
  last_message: string;
  last_sender: string;
  last_at: string;
  unread_count: number;
};

export default function SupportInboxPage() {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const supabase = createClient();

  const load = async () => {
    const { data: messages } = await supabase
      .from('support_messages')
      .select('user_id, sender, body, read, created_at')
      .order('created_at', { ascending: false });

    if (!messages) return;

    const byUser = new Map<string, typeof messages>();
    for (const m of messages) {
      if (!byUser.has(m.user_id)) byUser.set(m.user_id, []);
      byUser.get(m.user_id)!.push(m);
    }

    const userIds = [...byUser.keys()];
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
    const nameById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name || 'User']));

    const summaries: ThreadSummary[] = userIds.map((userId) => {
      const msgs = byUser.get(userId)!;
      const latest = msgs[0];
      const unread = msgs.filter((m) => m.sender === 'user' && !m.read).length;
      return {
        user_id: userId,
        full_name: nameById[userId] ?? 'User',
        last_message: latest.body,
        last_sender: latest.sender,
        last_at: latest.created_at,
        unread_count: unread,
      };
    });

    summaries.sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());
    setThreads(summaries);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('support_inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Support Chat</h1>
      <p className="text-sm text-neutral-500 mb-6">Active conversations, most recent first.</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Last message</TableHead>
            <TableHead>Unread</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {threads.map((t) => (
            <TableRow key={t.user_id}>
              <TableCell className="font-medium">{t.full_name}</TableCell>
              <TableCell className="text-sm text-neutral-500 max-w-xs truncate">
                {t.last_sender === 'admin' ? 'You: ' : ''}{t.last_message}
              </TableCell>
              <TableCell>{t.unread_count > 0 && <span className="text-xs font-semibold text-amber-500">{t.unread_count} new</span>}</TableCell>
              <TableCell>
                <Link href={`/admin/support/${t.user_id}`} className="text-sm font-medium underline">
                  Open
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
