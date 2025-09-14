import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation';
import BlueskyProfile from './components/BlueskyProfile';

export default async function Page() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const { data: notes } = await supabase.from('test_skeets').select()

  return (
    <div>
      <pre>{JSON.stringify(notes, null, 2)}</pre>
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Bluesky Profile Viewer</h1>
        <BlueskyProfile handle="sara012345.bsky.social" />
      </main>
    </div>
  );
}
