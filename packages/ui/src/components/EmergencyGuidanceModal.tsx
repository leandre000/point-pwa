import React from 'react';
import { PhoneCall, ShieldAlert, X } from 'lucide-react';

export interface EmergencyContact {
  label: string;
  phone: string;
  description: string;
}

export const RWANDA_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    label: 'Rwanda National Police (General Emergency)',
    phone: '112',
    description: 'Toll-free 24/7 emergency response across Rwanda',
  },
  {
    label: 'SAMU / Emergency Medical Services',
    phone: '912',
    description: 'Medical emergencies and ambulance dispatch in Kigali',
  },
  {
    label: 'Isange One Stop Center / Gender-Based Violence',
    phone: '114',
    description: 'Free, confidential medical and psychosocial support',
  },
  {
    label: 'Traffic Police & Accidents',
    phone: '113',
    description: 'Road accidents and traffic emergency assistance',
  },
];

export interface EmergencyGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyGuidanceModal: React.FC<EmergencyGuidanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl overflow-hidden flex flex-col p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-full bg-[var(--danger-tint)] text-[var(--danger)] flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text)] rounded-full hover:bg-[var(--surface-2)] min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h2 id="emergency-modal-title" className="text-xl font-bold text-[var(--text)]">
            Emergency & Safety Assistance
          </h2>
          <p className="text-sm text-[var(--danger)] font-semibold mt-1">
            If you are in immediate danger or facing an emergency, leave the area safely and call local authorities immediately.
          </p>
        </div>

        <div className="space-y-3">
          {RWANDA_EMERGENCY_CONTACTS.map((contact) => (
            <a
              key={contact.phone}
              href={`tel:${contact.phone}`}
              className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)] hover:bg-[var(--primary-tint)] transition-all group min-h-[56px]"
            >
              <div className="pr-3">
                <div className="text-sm font-bold text-[var(--text)] group-hover:text-[var(--primary)] flex items-center gap-1.5">
                  <span>{contact.label}</span>
                </div>
                <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {contact.description}
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--danger)] text-white font-bold text-sm shrink-0">
                <PhoneCall className="w-4 h-4" />
                <span>{contact.phone}</span>
              </div>
            </a>
          ))}
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text-secondary)] space-y-1">
          <p className="font-semibold text-[var(--text)]">Safety advice for in-person jobs:</p>
          <ul className="list-disc pl-4 space-y-0.5 text-[var(--text-tertiary)]">
            <li>Tell a family member or friend where you are meeting.</li>
            <li>Meet during daylight hours when possible.</li>
            <li>Inspect work before completing cash or mobile money transfer.</li>
            <li>Report suspicious behavior or threats in the KIRAKA app.</li>
          </ul>
        </div>

        <div>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-[var(--surface-2)] text-[var(--text)] font-semibold text-sm hover:bg-[var(--border)] transition-colors min-h-[48px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

