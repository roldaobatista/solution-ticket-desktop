'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PesagemPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/pesagem/entrada');
  }, [router]);

  return null;
}
