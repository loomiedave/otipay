'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string,
  country: string | null;
  created_at: string
};

type Kyc = {
  document_type: string;
  issuing_country: string;
  document_number: string | null;
  front_image_path: string;
  back_image_path: string | null;
  selfie_path: string;
  status: string;
  rejection_reason: string | null;
};

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [kyc, setKyc] = useState<Kyc | null>(null);
  const [imageUrls, setImageUrls] = useState<{ front?: string; back?: string; selfie?: string }>({});
  const [rejectReason, setRejectReason] = useState('');
  const supabase = createClient();

  const load = async () => {
    const { data: p } = await supabase.from('profiles').select('id, full_name, email, phone, country, created_at').eq('id', userId).single();
    setProfile(p);

    const { data: k } = await supabase.from('kyc_submissions').select('*').eq('user_id', userId).maybeSingle();
    setKyc(k);

    if (k) {
      const signOne = async (path: string) => {
        const { data, error } = await supabase.storage.from('kyc-documents').createSignedUrl(path, 3600);
        if (error) console.error('Signed URL error for', path, error);
        return data?.signedUrl;
      };
      setImageUrls({
        front: await signOne(k.front_image_path),
        back: k.back_image_path ? await signOne(k.back_image_path) : undefined,
        selfie: await signOne(k.selfie_path),
      });
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  const updateStatus = async (status: 'approved' | 'rejected') => {
    await supabase
      .from('kyc_submissions')
      .update({
        status,
        rejection_reason: status === 'rejected' ? rejectReason : null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    await load();
  };

  if (!profile) return <p className="text-neutral-500">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">{profile.full_name || 'Unnamed user'}</h1>
      <p className="text-sm text-neutral-500 mb-6">
        {profile.phone || 'No phone on file'} · Joined {new Date(profile.created_at).toLocaleDateString()}
      </p>
      <p className="text-sm text-neutral-500 mb-6">
        {profile.email} · {profile.phone || 'No phone on file'} · Joined {new Date(profile.created_at).toLocaleDateString()}
      </p>

      {!kyc && <p className="text-sm text-neutral-500">No KYC submission yet.</p>}

      {kyc && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-500">Document type</p>
              <p className="font-medium capitalize">{kyc.document_type.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-neutral-500">Issuing country</p>
              <p className="font-medium">{kyc.issuing_country}</p>
            </div>
            <div>
              <p className="text-neutral-500">Document number</p>
              <p className="font-medium">{kyc.document_number || '—'}</p>
            </div>
            <div>
              <p className="text-neutral-500">Status</p>
              <p className="font-medium capitalize">{kyc.status}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {imageUrls.front && <img src={imageUrls.front} className="rounded-lg border border-neutral-800" alt="Document front" />}
            {imageUrls.back && <img src={imageUrls.back} className="rounded-lg border border-neutral-800" alt="Document back" />}
            {imageUrls.selfie && <img src={imageUrls.selfie} className="rounded-lg border border-neutral-800" alt="Selfie" />}
          </div>

          {kyc.status === 'pending' && (
            <div className="space-y-2">
              <input
                placeholder="Reason if rejecting…"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-md border border-neutral-800 bg-transparent px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={() => updateStatus('approved')}>Approve</Button>
                <Button variant="outline" onClick={() => updateStatus('rejected')}>Reject</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
