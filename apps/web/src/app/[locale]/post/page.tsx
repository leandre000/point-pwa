'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { TopAppBar, Button, Input, Textarea, Card } from '@kiraka/ui';
import { Sparkles, MapPin, DollarSign, CheckCircle2 } from 'lucide-react';

export default function PostJobPage() {
  const t = useTranslations('post');
  const router = useRouter();

  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [category, setCategory] = React.useState('cleaning');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [area, setArea] = React.useState('Remera');
  const [budget, setBudget] = React.useState('');

  const steps = [
    { num: 1, label: t('step1') },
    { num: 2, label: t('step2') },
    { num: 3, label: t('step3') },
    { num: 4, label: t('step4') },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <TopAppBar
        title={t('title')}
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
        <div className="space-y-4 py-4">
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
                    className={`p-4 rounded-[var(--radius-card)] border text-left font-medium transition-all ${
                      category === c.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-tint)] text-[var(--color-primary)]'
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
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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

              <Input
                label={t('budgetLabel')}
                placeholder={t('budgetPlaceholder')}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                helperText="Leave empty if negotiable"
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-[18px] font-bold text-[var(--color-text)]">
                Review before publishing
              </h2>
              <Card className="space-y-3">
                <div>
                  <span className="text-[12px] text-[var(--color-text-tertiary)] uppercase font-semibold">
                    Category
                  </span>
                  <p className="font-semibold text-[15px] capitalize text-[var(--color-text)]">
                    {category}
                  </p>
                </div>
                <div>
                  <span className="text-[12px] text-[var(--color-text-tertiary)] uppercase font-semibold">
                    Job Title
                  </span>
                  <p className="font-semibold text-[15px] text-[var(--color-text)]">
                    {title || 'Untitled Request'}
                  </p>
                </div>
                <div>
                  <span className="text-[12px] text-[var(--color-text-tertiary)] uppercase font-semibold">
                    Neighborhood
                  </span>
                  <p className="font-semibold text-[15px] text-[var(--color-text)]">
                    {area}, Kigali
                  </p>
                </div>
                <div>
                  <span className="text-[12px] text-[var(--color-text-tertiary)] uppercase font-semibold">
                    Budget
                  </span>
                  <p className="font-bold text-[16px] text-[var(--color-accent-text)] tabular-nums">
                    {budget || 'Negotiable'}
                  </p>
                </div>
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
              onClick={() => setStep((s) => (s + 1) as any)}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                alert('Job published successfully! (Demo)');
                router.push('/jobs');
              }}
            >
              {t('publishAction')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

