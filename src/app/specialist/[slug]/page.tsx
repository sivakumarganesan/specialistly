'use client';

import { SpecialistLandingPage } from '@/app/components/SpecialistLandingPage';

interface SpecialistPageProps {
  params: {
    slug: string;
  };
}

export default function SpecialistPage({ params }: SpecialistPageProps) {
  return <SpecialistLandingPage slug={params.slug} />;
}
