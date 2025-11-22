'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ThreadsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/chats');
  }, [router]);

  return null;
} 