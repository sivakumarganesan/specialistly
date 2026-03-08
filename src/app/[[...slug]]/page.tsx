'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SpecialistLandingPage } from '@/app/components/SpecialistLandingPage';

interface RootPageProps {
  params: {
    slug?: string[];
  };
}

export default function RootPage({ params }: RootPageProps) {
  const router = useRouter();
  const slug = params.slug?.[0];

  // If we have a slug and it starts with a subdomain-like pattern, show specialist page
  if (slug) {
    return <SpecialistLandingPage slug={slug} />;
  }

  // Otherwise redirect to home
  useEffect(() => {
    router.push('/');
  }, [router]);

  return <div>Redirecting...</div>;
}
