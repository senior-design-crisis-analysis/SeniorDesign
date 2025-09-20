// components/BlueskyProfileCard.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface BlueskyProfile {
  did: string;
  handle: string;
  displayName: string;
  avatar: string;
  followersCount: number;
  followsCount: number;
  postsCount: number;
}

export default function BlueskyProfileCard({ handle }: { handle: string }) {
  const [profile, setProfile] = useState<BlueskyProfile | null>(null);

  useEffect(() => {
    fetch(`/test_skeets/api/bluesky/profile?handle=${handle}`)
      .then((res) => res.json())
      .then(setProfile);
  }, [handle]);

  if (!profile) return <p>Loading profile...</p>;

  return (
    <Card className="w-80 shadow-md">
      <CardHeader className="flex flex-col items-center space-y-2">
        <Avatar className="w-20 h-20">
          <AvatarImage src={profile.avatar} alt={profile.displayName} />
          <AvatarFallback>
            {profile.displayName?.[0] ?? profile.handle[0]}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-bold">
          {profile.displayName || profile.handle}
        </h2>
        <p className="text-sm text-gray-500">@{profile.handle}</p>
      </CardHeader>
      <CardContent className="flex justify-around text-sm">
        <div className="text-center">
          <p className="font-bold">{profile.followersCount}</p>
          <p className="text-gray-500">Followers</p>
        </div>
        <div className="text-center">
          <p className="font-bold">{profile.followsCount}</p>
          <p className="text-gray-500">Following</p>
        </div>
        <div className="text-center">
          <p className="font-bold">{profile.postsCount}</p>
          <p className="text-gray-500">Posts</p>
        </div>
      </CardContent>
    </Card>
  );
}
