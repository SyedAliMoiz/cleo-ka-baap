'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ThreadRedirectPage() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/chats/${id}`);
  }, [id, router]);

  return null;
} 