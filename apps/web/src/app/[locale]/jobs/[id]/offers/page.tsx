'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import {
  TopAppBar,
  OfferCard,
  AcceptConfirmationSheet,
  EmptyState,
  Badge,
} from '@kiraka/ui';
import { MessageSquare, ArrowLeft } from 'lucide-react';

export default function JobOffersComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [selectedOffer, setSelectedOffer] = React.useState<any | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [accepting, setAccepting] = React.useState(false);

  // Demo offers received for this job
  const [offers, setOffers] = React.useState([
    {
      id: 'off-1',
      businessName: 'Patrick Express Plumbing',
      providerRating: 4.8,
      ratingCount: 14,
      completedJobs: 18,
      areaName: 'Kimihurura, Gasabo',
      distanceBand: '~1.8 km',
      priceAmount: 12000,
      priceCurrency: 'RWF',
      message: 'Can be there in 45 minutes with replacement brass valve and pipes.',
      availability: 'Today at 11:00 AM',
      version: 1,
      status: 'SUBMITTED',
    },
    {
      id: 'off-2',
      businessName: 'Kigali Rapid Pipe Services',
      providerRating: 4.6,
      ratingCount: 8,
      completedJobs: 9,
      areaName: 'Remera, Gasabo',
      distanceBand: '~0.9 km',
      priceAmount: 10000,
      priceCurrency: 'RWF',
      message: 'Standard leak seal and inspection. 30 days guarantee on the fitting.',
      availability: 'Today afternoon',
      version: 1,
      status: 'SUBMITTED',
    },
    {
      id: 'off-3',
      businessName: 'Emmanuel Nshimiye',
      providerRating: 4.9,
      ratingCount: 26,
      completedJobs: 31,
      areaName: 'Kacyiru, Gasabo',
      distanceBand: '~2.5 km',
      priceAmount: 14000,
      priceCurrency: 'RWF',
      message: 'Full drain and pipe inspection included. Will bring all materials.',
      availability: 'Flexible',
      version: 1,
      status: 'SUBMITTED',
    },
  ]);

  const handleOpenAccept = (offer: any) => {
    setSelectedOffer(offer);
    setConfirmOpen(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedOffer) return;
    setAccepting(true);

    try {
      // Call accept API
      await fetch(`/api/v1/offers/${selectedOffer.id}/accept`, {
        method: 'POST',
      }).catch(() => null);

      setConfirmOpen(false);
      alert(`Offer accepted! Match created with ${selectedOffer.businessName}.`);
      router.push('/messages');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopAppBar
        title="Compare Received Offers"
        subtitle="3 offers · Best match first"
        onBack={() => router.push('/jobs')}
      />

      <div className="p-4 max-w-2xl mx-auto w-full space-y-4 flex-1">
        <div className="p-3.5 rounded-[var(--radius-card)] bg-[var(--color-primary-tint)] border border-[var(--color-primary)]/20 text-[13px] text-[var(--color-text)] flex items-center justify-between">
          <div>
            <p className="font-semibold">Fix kitchen sink pipe leak</p>
            <p className="text-[12px] text-[var(--color-text-secondary)]">Remera, Gasabo · Budget: 12,000 RWF</p>
          </div>
          <Badge status="open" label="Open for offers" />
        </div>

        <div className="space-y-3">
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              id={offer.id}
              businessName={offer.businessName}
              providerRating={offer.providerRating}
              ratingCount={offer.ratingCount}
              completedJobs={offer.completedJobs}
              areaName={offer.areaName}
              distanceBand={offer.distanceBand}
              priceAmount={offer.priceAmount}
              priceCurrency={offer.priceCurrency}
              message={offer.message}
              availability={offer.availability}
              version={offer.version}
              onAccept={() => handleOpenAccept(offer)}
              onCounter={() => alert('Counteroffer dialog (Demo)')}
              onViewProfile={() => router.push('/providers')}
            />
          ))}
        </div>
      </div>

      {selectedOffer && (
        <AcceptConfirmationSheet
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          priceAmount={selectedOffer.priceAmount}
          priceCurrency={selectedOffer.priceCurrency}
          providerName={selectedOffer.businessName}
          loading={accepting}
          onConfirm={handleConfirmAccept}
        />
      )}
    </div>
  );
}
