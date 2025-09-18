// components/BlueskyProfile.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";

export default function BlueskyProfile({ handle }: { handle: string }) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/bluesky/profile?handle=${handle}`)
      .then((res) => res.json())
      .then(setProfile);
  }, [handle]);

  if (!profile) return <p>Loading profile...</p>;
  if (profile.error) return <p>Error: {profile.error}</p>;

  return (
    <div className="rounded-xl border p-4 shadow space-y-2">
      <img
        src={profile.avatar}
        alt={profile.displayName}
        className="w-16 h-16 rounded-full"
      />
      <h2 className="text-xl font-bold">{profile.displayName}</h2>
      <p className="text-gray-600">@{profile.handle}</p>
      <p>{profile.description}</p>
    </div>
  );
}
