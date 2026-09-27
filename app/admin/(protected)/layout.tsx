import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-56 border-r border-border p-4 space-y-1">
        <p className="text-xs uppercase tracking-wide text-foreground mb-4 px-2">Admin</p>

        <Link href="/admin/rates" className="block px-2 py-2 rounded-md hover:bg-primary hover:text-secondary text-sm font-medium">
          Rates & Fees
        </Link>

        <Link href="/admin/support" className="block px-2 py-2 rounded-md hover:bg-primary hover:text-secondary text-sm font-medium">
          Messages
        </Link>

        <Link href="/admin/users" className="block px-2 py-2 rounded-md hover:bg-primary hover:text-secondary text-sm font-medium">
          Users
        </Link>

        <Link href="/admin/transfers" className="block px-2 py-2 rounded-md hover:bg-primary hover:text-secondary text-sm font-medium">
          Transfers
        </Link>


      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
