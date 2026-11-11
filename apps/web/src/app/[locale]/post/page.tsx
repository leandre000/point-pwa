'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import {
  TopAppBar,
  Button,
  Input,
  Textarea,
  Card,
  ImageUploader,
  Banner,
} from '@kiraka/ui';
import { ShieldCheck, MapPin, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

const DRAFT_KEY = 'kiraka_post_job_draft';

export default function PostJobPage() {
  const t = useTranslations('post');
  const router = useRouter();

  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [category, setCategory] = React.useState('cleaning');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [area, setArea] = React.useState('Remera');
  const [timing, setTiming] = React.useState('Flexible');
  const [budgetAmount, setBudgetAmount] = React.useState('');
  const [negotiable, setNegotiable] = React.useState(true);
  const [draftSavedTime, setDraftSavedTime] = React.useState<string | null>(null);
  const [publishing, setPublishing] = React.useState(false);

  // Load saved draft on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.category) setCategory(draft.category);
        if (draft.title) setTitle(draft.title);
        if (draft.description) setDescription(draft.description);
        if (draft.photos) setPhotos(draft.photos);
        if (draft.area) setArea(draft.area);
        if (draft.budgetAmount) setBudgetAmount(draft.budgetAmount);
        setDraftSavedTime('Restored from draft');
      }
    } catch (_) {}
  }, []);

  // Autosave draft on changes
  React.useEffect(() => {
    if (!title && !description) return;
    const draft = { category, title, description, photos, area, budgetAmount };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setDraftSavedTime('Saved just now');
    } catch (_) {}
  }, [category, title, description, photos, area, budgetAmount]);

  const steps = [
    { num: 1, label: t('step1') },
    { num: 2, label: t('step2') },
    { num: 3, label: t('step3') },
    { num: 4, label: t('step4') },
  ];

  const handlePublish = async () => {
    setPublishing(true);
    try {
      // Clear draft on publish
      localStorage.removeItem(DRAFT_KEY);

      // Call API or demo fallback
      await fetch('/api/v1/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: 'cat-1',
          areaId: 'area-1',
          title,
          description,
          budgetAmount: budgetAmount ? parseInt(budgetAmount.replace(/\D/g, '')) : undefined,
          budgetNegotiable: negotiable,
          timingPreference: timing,
          photos,
        }),
      }).catch(() => null);

      alert('Job request published! Providers in your area have been notified.');
      router.push('/jobs');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopAppBar
        title={t('title')}
        subtitle={draftSavedTime || undefined}
        onBack={step > 1 ? () => setStep((s) => (s - 1) as any) : () => router.push('/')}
      />

      {/* Stepper indicator */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                    step >= s.num
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)]'
                  }`}
                >
                  {s.num}
                </div>
                <span className="text-[12px] font-medium hidden sm:inline text-[var(--color-text)]">
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    step > s.num ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col justify-between">
        <div className="space-y-5 py-4">
          {step === 1 && (
            <div className="space-y-3">
              <h2 className="text-[18px] font-bold text-[var(--color-text)]">
                {t('categoryLabel')}
              </h2>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { id: 'cleaning', name: 'Cleaning & Housekeeping' },
                  { id: 'plumbing', name: 'Plumbing & Pipe Repair' },
                  { id: 'electrical', name: 'Electrical & Appliances' },
                  { id: 'carpentry', name: 'Carpentry & Furniture Repair' },
                  { id: 'maintenance', name: 'General Home Maintenance' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`p-4 rounded-[var(--radius-card)] border text-left font-medium transition-all min-h-[48px] ${
                      category === c.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-tint)] text-[var(--color-primary)] font-semibold'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Input
                label={t('titleLabel')}
                placeholder={t('titlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                label={t('descLabel')}
                placeholder={t('descPlaceholder')}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Client-side photo compression uploader */}
              <ImageUploader
                images={photos}
                onChange={setPhotos}
                maxImages={4}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-[14px] font-medium text-[var(--color-text)] mb-1.5 block">
                  {t('areaLabel')}
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[16px] text-[var(--color-text)]"
                >
                  <option value="Remera">Remera, Gasabo</option>
                  <option value="Kacyiru">Kacyiru, Gasabo</option>
                  <option value="Kimihurura">Kimihurura, Gasabo</option>
                  <option value="Nyamirambo">Nyamirambo, Nyarugenge</option>
                  <option value="Kiyovu">Kiyovu, Nyarugenge</option>
                  <option value="Gikondo">Gikondo, Kicukiro</option>
                </select>
              </div>

              <div>
                <label className="text-[14px] font-medium text-[var(--color-text)] mb-1.5 block">
                  When do you need this done?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Today', 'This Week', 'Flexible'].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setTiming(time)}
                      className={`py-2 px-3 text-[13px] rounded-[var(--radius-control)] border font-medium ${
                        timing === time
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary-tint)] text-[var(--color-primary)] font-semibold'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  label={t('budgetLabel')}
                  placeholder="e.g. 15000"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  helperText="Amounts are in Rwandan Francs (RWF)"
                />

                <label className="flex items-center gap-2 text-[14px] text-[var(--color-text)] cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={negotiable}
                    onChange={(e) => setNegotiable(e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--color-primary)]"
                  />
                  <span>Open to provider counteroffers (Negotiable)</span>
                </label>
              </div>

              <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-2)] p-3 text-[12px] text-[var(--color-text-secondary)] flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                <span>
                  Your exact home or office address is private. It is only shared with the provider you choose to accept.
                </span>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-[18px] font-bold text-[var(--color-text)]">
                Review your request
              </h2>
              <Card className="space-y-3">
                <div>
                  <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase font-semibold">
                    Category
                  </span>
                  <p className="font-semibold text-[15px] capitalize text-[var(--color-text)]">
                    {category}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase font-semibold">
                    Job Title
                  </span>
                  <p className="font-semibold text-[15px] text-[var(--color-text)]">
                    {title || 'Untitled Request'}
                  </p>
                </div>

                {description && (
                  <div>
                    <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase font-semibold">
                      Details
                    </span>
                    <p className="text-[13px] text-[var(--color-text-secondary)]">
                      {description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-border)]">
                  <div>
                    <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase font-semibold">
                      Neighborhood
                    </span>
                    <p className="font-medium text-[14px] text-[var(--color-text)]">
                      {area}, Kigali
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase font-semibold">
                      Timing
                    </span>
                    <p className="font-medium text-[14px] text-[var(--color-text)]">
                      {timing}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
                  <span className="text-[13px] text-[var(--color-text-secondary)] font-medium">
                    Estimated Budget:
                  </span>
                  <span className="text-[18px] font-bold text-[var(--color-accent-text)] tabular-nums">
                    {budgetAmount ? `${budgetAmount} RWF` : 'Negotiable'}
                  </span>
                </div>

                {photos.length > 0 && (
                  <div className="pt-2 border-t border-[var(--color-border)]">
                    <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase font-semibold block mb-1.5">
                      Attached Photos ({photos.length})
                    </span>
                    <div className="flex gap-2">
                      {photos.map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          alt="Thumbnail"
                          className="h-12 w-12 rounded object-cover border border-[var(--color-border)]"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-[var(--color-border)]">
          {step < 4 ? (
            <Button
              variant="primary"
              fullWidth
              disabled={step === 2 && (!title || !description)}
              onClick={() => setStep((s) => (s + 1) as any)}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              fullWidth
              loading={publishing}
              onClick={handlePublish}
            >
              {t('publishAction')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
