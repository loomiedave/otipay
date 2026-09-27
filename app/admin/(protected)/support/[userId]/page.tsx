'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Message = {
  id: string;
  sender: 'user' | 'admin' | 'bot';
  body: string;
  created_at: string;
};

export default function SupportThreadPage() {
  const { userId } = useParams<{ userId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const supabase = createClient();

  const load = async () => {
    const { data } = await supabase
      .from('support_messages')
      .select('id, sender, body, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);

    // mark incoming user messages as read once the admin opens the thread
    await supabase.from('support_messages').update({ read: true }).eq('user_id', userId).eq('sender', 'user');
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`support_thread_${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `user_id=eq.${userId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const handleSend = async () => {
    if (!draft.trim()) return;
    await supabase.from('support_messages').insert({ user_id: userId, sender: 'admin', body: draft.trim() });
    setDraft('');
  };

  return (
    <div className="flex flex-col h-[80vh]">
      <h1 className="text-lg font-semibold mb-4">Conversation</h1>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`px-4 py-2 rounded-2xl max-w-md text-sm ${
                m.sender === 'admin' ? 'bg-blue-700 text-white' : 'bg-neutral-800 text-neutral-100'
              }`}
            >
              {m.body}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a reply…"
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
}
