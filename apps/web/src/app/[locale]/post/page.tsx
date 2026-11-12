'use client';

import * as React from 'react';
import { useRouter } from '@/i18n/routing';
import { Button, Banner } from '@kiraka/ui';
import { ImageUploader } from '@/components/ImageUploader.js';
import { UploadPurpose } from '@kiraka/contracts';
import {
  MapPin,
  Clock,
  Check,
  Lock,
  X,
  Wrench,
  Zap,
  Sparkles,
  Hammer,
  HelpCircle,
  Camera,
  Info,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client.js';
import { useAuth } from '@/lib/auth-context.js';
import { useAuthGate } from '@/components/AuthGate.js';

const DRAFT_KEY = 'kiraka_post_job_draft';

const KIGALI_AREAS = [
  'Kacyiru, Gasabo',
  'Remera, Gasabo',
  'Kimihurura, Gasabo',
  'Kibagabaga, Gasabo',
  'Nyarutarama, Gasabo',
  'Kimironko, Gasabo',
  'Gisozi, Gasabo',
  'Kicukiro, Kicukiro',
  'Gikondo, Kicukiro',
  'Kanombe, Kicukiro',
  'Nyamirambo, Nyarugenge',
  'Kagugu, Gasabo',
];

const CATEGORY_OPTIONS = [
  { slug: 'plumbing', name: 'Plumbing', icon: Wrench, defaultPrice: '8,000' },
  { slug: 'electrical', name: 'Electrical', icon: Zap, defaultPrice: '10,000' },
  { slug: 'cleaning', name: 'Cleaning', icon: Sparkles, defaultPrice: '6,000' },
  { slug: 'carpentry', name: 'Carpentry', icon: Hammer, defaultPrice: '12,000' },
  { slug: 'maintenance', name: 'General Maintenance', icon: HelpCircle, defaultPrice: '7,000' },
];

export default function PostJobPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { openAuthGate } = useAuthGate();

  // Mode switcher at top matching PointMe
  const [activeMode, setActiveMode] = React.useState<'seeking' | 'offering'>('seeking');

  // Form states (PointMe "What needs fixing?" layout)
  const [title, setTitle] = React.useState('');
  const [categorySlug, setCategorySlug] = React.useState('plumbing');
  const [description, setDescription] = React.useState('');
  const [areaName, setAreaName] = React.useState(user?.customerProfile?.neighborhood || 'Kacyiru, Gasabo');
  const [addressNotes, setAddressNotes] = React.useState('');
  const [suggestedPrice, setSuggestedPrice] = React.useState('8,000');
  const [isNegotiable, setIsNegotiable] = React.useState(false);
  const [timingType, setTimingType] = React.useState<'asap' | 'scheduled' | 'flexible'>('asap');
  const [scheduledDate, setScheduledDate] = React.useState('');
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [showAddressNotes, setShowAddressNotes] = React.useState(false);
  const [showPhotoUploader, setShowPhotoUploader] = React.useState(false);

  // Status & categories
  const [categories, setCategories] = React.useState<any[]>([]);
  const [areas, setAreas] = React.useState<any[]>([]);
  const [publishing, setPublishing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load API reference data
  React.useEffect(() => {
    async function loadMeta() {
      try {
        const [cats, ars] = await Promise.all([
          apiClient<any[]>('/api/v1/categories').catch(() => []),
          apiClient<any[]>('/api/v1/areas').catch(() => []),
        ]);
        if (cats && cats.length > 0) setCategories(cats);
        if (ars && ars.length > 0) setAreas(ars);
      } catch {}
    }
    loadMeta();
  }, []);

  // Restore draft from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.title) setTitle(draft.title);
        if (draft.categorySlug) setCategorySlug(draft.categorySlug);
        if (draft.description) setDescription(draft.description);
        if (draft.areaName) setAreaName(draft.areaName);
        if (draft.addressNotes) setAddressNotes(draft.addressNotes);
        if (draft.suggestedPrice) setSuggestedPrice(draft.suggestedPrice);
        if (draft.isNegotiable !== undefined) setIsNegotiable(draft.isNegotiable);
        if (draft.timingType) setTimingType(draft.timingType);
        if (draft.scheduledDate) setScheduledDate(draft.scheduledDate);
        if (draft.photos) setPhotos(draft.photos);
      }
    } catch {}
  }, []);

  // Autosave draft on changes
  React.useEffect(() => {
    if (!title && !description) return;
    const draft = {
      title,
      categorySlug,
      description,
      areaName,
      addressNotes,
      suggestedPrice,
      isNegotiable,
      timingType,
      scheduledDate,
      photos,
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [title, categorySlug, description, areaName, addressNotes, suggestedPrice, isNegotiable, timingType, scheduledDate, photos]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Relaxed validation: title must be at least 2 chars
    if (title.trim().length < 2) {
      setError('Please enter what needs fixing (e.g. Fix leaking kitchen pipe).');
      return;
    }

    // Guest Gating with intent preservation
    if (!isAuthenticated) {
      openAuthGate('Sign in to broadcast your job request to nearby Kigali specialists.', '/post');
      return;
    }

    setPublishing(true);
    try {
      const chosenCat = categories.find((c) => c.slug === categorySlug) || categories[0];
      const areaPrefix = areaName.split(',')[0]?.trim() || 'Kacyiru';
      const chosenArea = areas.find((a) => a.name.toLowerCase().includes(areaPrefix.toLowerCase())) || areas[0];

      const priceNum = isNegotiable
        ? undefined
        : parseInt(suggestedPrice.replace(/[^0-9]/g, ''), 10) || undefined;

      const timingLabel =
        timingType === 'asap'
          ? 'Needed now · ASAP'
          : timingType === 'scheduled' && scheduledDate
          ? `Scheduled for ${scheduledDate}`
          : 'Flexible timing';

      const createdJob = await apiClient<any>('/api/v1/jobs', {
        method: 'POST',
        body: JSON.stringify({
          categoryId: chosenCat?.id || '00000000-0000-0000-0000-000000000001',
          areaId: chosenArea?.id || '00000000-0000-0000-0000-000000000001',
          title: title.trim(),
          description: description.trim() || title.trim(),
          addressNotes: addressNotes.trim() || undefined,
          budgetAmount: priceNum,
          budgetCurrency: 'RWF',
          budgetNegotiable: isNegotiable,
          timingPreference: timingLabel,
          windowType: timingType,
          photos,
        }),
      });

      // Clear draft on success
      localStorage.removeItem(DRAFT_KEY);

      // Deep link to created job offers page or job details
      router.push(`/jobs/${createdJob.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to broadcast job. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const selectedCategory = CATEGORY_OPTIONS.find((c) => c.slug === categorySlug) || CATEGORY_OPTIONS[0]!;
  const IconComponent = selectedCategory.icon;

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col items-center pb-24 md:pb-12 w-full">
      {/* Top Segment Switcher matching PointMe reference */}
      <div className="w-full max-w-lg px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sticky top-0 z-20 bg-[#F7F7F5]/90 backdrop-blur-md">
        <div className="flex rounded-full bg-[#E8E7E3] p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveMode('seeking')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all min-h-[38px] ${
              activeMode === 'seeking'
                ? 'bg-[#1F513F] text-white shadow-sm'
                : 'text-[#5E6862] hover:text-[#1A201C]'
            }`}
          >
            Seeking Help
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('offering');
              router.push('/jobs');
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all min-h-[38px] ${
              activeMode === 'offering'
                ? 'bg-[#1F513F] text-white shadow-sm'
                : 'text-[#5E6862] hover:text-[#1A201C]'
            }`}
          >
            Offering Help
          </button>
        </div>
      </div>

      {/* Main Broadcast Card (PointMe "What needs fixing?" Sheet) */}
      <div className="w-full max-w-lg px-3 sm:px-4 py-2 sm:py-3">
        <div className="rounded-3xl bg-white border border-[#E8E7E3] shadow-sm p-4 sm:p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1A201C]">
              What needs fixing?
            </h1>
            <button
              type="button"
              onClick={() => router.back()}
              className="p-1.5 rounded-full text-[#5E6862] hover:bg-[#F2F1ED] transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Feedback banner */}
          {error && (
            <Banner
              variant="warning"
              message={error}
              onDismiss={() => setError(null)}
            />
          )}

          <form onSubmit={handleBroadcast} className="space-y-4">
            {/* Task Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1A201C]">
                Task title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fix leaking kitchen pipe"
                className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-[#E8E7E3] bg-white text-base sm:text-sm text-[#1A201C] placeholder:text-[#8E9892] focus:outline-none focus:ring-2 focus:ring-[#1F513F]"
                autoFocus
              />
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1A201C]">
                Category
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-3 sm:top-3.5 text-[#1F513F]">
                  <IconComponent className="h-5 w-5" />
                </div>
                <select
                  value={categorySlug}
                  onChange={(e) => {
                    const slug = e.target.value;
                    setCategorySlug(slug);
                    const opt = CATEGORY_OPTIONS.find((c) => c.slug === slug);
                    if (opt && !isNegotiable) setSuggestedPrice(opt.defaultPrice);
                  }}
                  className="w-full h-11 sm:h-12 pl-11 pr-8 rounded-xl border border-[#E8E7E3] bg-white text-base sm:text-sm font-medium text-[#1A201C] focus:outline-none focus:ring-2 focus:ring-[#1F513F] appearance-none cursor-pointer truncate"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3.5 top-3.5 sm:top-4 text-[#8E9892]">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* A little more detail (Textarea with relaxed validation) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#1A201C]">
                  A little more detail
                </label>
                <span className="text-[11px] text-[#8E9892]">Optional</span>
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Pipe under the kitchen sink is dripping. Please bring tools to check the joint."
                className="w-full p-3 rounded-xl border border-[#E8E7E3] bg-white text-base sm:text-sm text-[#1A201C] placeholder:text-[#8E9892] focus:outline-none focus:ring-2 focus:ring-[#1F513F] resize-none"
              />
            </div>

            {/* Location row */}
            <div className="p-3 rounded-xl bg-[#F8F8F6] border border-[#E8E7E3] space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <MapPin className="h-4 w-4 text-[#1F513F] shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <select
                      value={areaName}
                      onChange={(e) => setAreaName(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-[#1A201C] focus:outline-none cursor-pointer w-full truncate"
                    >
                      {KIGALI_AREAS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-[#5E6862] mt-0.5 truncate">
                      Inside the Kigali launch area · within 5 km
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressNotes(!showAddressNotes)}
                  className="text-xs font-semibold text-[#1F513F] hover:underline shrink-0"
                >
                  {showAddressNotes ? 'Hide notes' : 'Add note'}
                </button>
              </div>

              {/* Private Address Notes */}
              {showAddressNotes && (
                <div className="pt-2 border-t border-[#E8E7E3]/60 space-y-1">
                  <div className="flex items-center gap-1 text-[11px] text-[#5E6862]">
                    <Lock className="h-3 w-3 text-[#1F513F]" />
                    <span>Private notes (shared only after agreement):</span>
                  </div>
                  <input
                    type="text"
                    value={addressNotes}
                    onChange={(e) => setAddressNotes(e.target.value)}
                    placeholder="e.g. Near BK Arena, yellow gate"
                    className="w-full h-9 px-2.5 rounded-lg border border-[#E8E7E3] bg-white text-base sm:text-xs text-[#1A201C] focus:outline-none focus:ring-2 focus:ring-[#1F513F]"
                  />
                </div>
              )}
            </div>

            {/* Suggested Labor Price */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <label className="block text-xs font-semibold text-[#1A201C]">
                  Suggested labor price · RWF
                </label>
                <button
                  type="button"
                  onClick={() => setIsNegotiable(!isNegotiable)}
                  className={`text-xs font-medium transition-colors ${
                    isNegotiable ? 'text-[#1F513F] font-bold' : 'text-[#5E6862]'
                  }`}
                >
                  {isNegotiable ? '✓ Negotiable price' : 'Mark as negotiable'}
                </button>
              </div>
              <input
                type="text"
                disabled={isNegotiable}
                value={isNegotiable ? 'Negotiable with specialists' : suggestedPrice}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setSuggestedPrice(val ? Number(val).toLocaleString() : '');
                }}
                placeholder="8,000"
                className={`w-full h-11 sm:h-12 px-3.5 rounded-xl border border-[#E8E7E3] text-base sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1F513F] ${
                  isNegotiable
                    ? 'bg-[#F2F1ED] text-[#5E6862]'
                    : 'bg-white text-[#1A201C]'
                }`}
              />
            </div>

            {/* Timing selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1A201C]">
                When do you need help?
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {[
                  { id: 'asap', label: 'Needed now' },
                  { id: 'scheduled', label: 'Pick date' },
                  { id: 'flexible', label: 'Flexible' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimingType(t.id as any)}
                    className={`py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all border text-center truncate ${
                      timingType === t.id
                        ? 'bg-[#E8F1EC] text-[#1F513F] border-[#1F513F]'
                        : 'bg-white text-[#5E6862] border-[#E8E7E3] hover:bg-[#F8F8F6]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {timingType === 'scheduled' && (
                <div className="pt-2">
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E8E7E3] bg-white text-base sm:text-xs text-[#1A201C]"
                  />
                </div>
              )}
            </div>

            {/* Optional Photo Attachment toggle */}
            <div className="pt-1">
              {!showPhotoUploader ? (
                <button
                  type="button"
                  onClick={() => setShowPhotoUploader(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#1F513F] hover:underline"
                >
                  <Camera className="h-4 w-4" />
                  <span>Attach photos (optional, up to 5)</span>
                </button>
              ) : (
                <div className="space-y-2 p-3 bg-[#F8F8F6] rounded-xl border border-[#E8E7E3]">
                  <div className="flex justify-between items-center text-xs font-semibold text-[#1A201C]">
                    <span>Attach Photos</span>
                    <button
                      type="button"
                      onClick={() => setShowPhotoUploader(false)}
                      className="text-[#8E9892] hover:text-[#1A201C]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <ImageUploader
                    purpose={UploadPurpose.JOB_PHOTO}
                    existingUrls={photos}
                    onChange={setPhotos}
                    maxFiles={5}
                  />
                </div>
              )}
            </div>

            {/* Green info note matching PointMe reference */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#E8F1EC] border border-[#1F513F]/15 flex items-start gap-2.5 text-xs text-[#1F513F]">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-[#1F513F]" />
              <p className="leading-relaxed text-[11px] sm:text-xs">
                <span className="font-semibold">KIRAKA is 100% free during pilot.</span> This request has zero platform fee; you pay the worker's agreed labor price directly.
              </p>
            </div>

            {/* Big Primary Green Broadcast Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={publishing}
              className="w-full min-h-[48px] h-auto py-3 px-4 rounded-full bg-[#1F513F] hover:bg-[#163C2E] text-white font-bold text-xs sm:text-sm md:text-base leading-snug flex items-center justify-center gap-2 shadow-sm text-center"
            >
              {publishing ? 'Broadcasting...' : `Broadcast to nearby ${selectedCategory.name.toLowerCase()} specialists`}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
