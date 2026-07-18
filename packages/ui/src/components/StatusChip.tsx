import type { OrderStatus } from '@royal-spirits/shared';

const STATUS_MAP: Record<
  string,
  { label: string; colorVar: string; bgVar: string }
> = {
  Ordered: { label: 'Ordered', colorVar: 'var(--rs-status-placed)', bgVar: 'var(--rs-status-placed)' },
  Processing: {
    label: 'Processing',
    colorVar: 'var(--rs-status-confirmed)',
    bgVar: 'var(--rs-status-confirmed)',
  },
  Delivered: {
    label: 'Delivered',
    colorVar: 'var(--rs-status-delivered)',
    bgVar: 'var(--rs-status-delivered)',
  },
  Cancelled: { label: 'Cancelled', colorVar: 'var(--rs-danger)', bgVar: 'var(--rs-danger)' },
  Paid: { label: 'Paid', colorVar: 'var(--rs-status-delivered)', bgVar: 'var(--rs-status-delivered)' },
  Unpaid: { label: 'Unpaid', colorVar: 'var(--rs-status-shipping)', bgVar: 'var(--rs-status-shipping)' },
};

export interface StatusChipProps {
  status: OrderStatus | string;
  className?: string;
}

export function StatusChip({ status, className = '' }: StatusChipProps) {
  const cfg = STATUS_MAP[status] ?? {
    label: status,
    colorVar: 'var(--rs-on-surface-variant)',
    bgVar: 'var(--rs-on-surface-variant)',
  };
  return (
    <span
      className={[
        'inline-flex items-center rounded-rs-full px-3 py-1 text-xs font-medium uppercase tracking-wide',
        className,
      ].join(' ')}
      style={{
        color: cfg.colorVar,
        backgroundColor: `color-mix(in srgb, ${cfg.bgVar} 12%, transparent)`,
      }}
    >
      {cfg.label}
    </span>
  );
}
