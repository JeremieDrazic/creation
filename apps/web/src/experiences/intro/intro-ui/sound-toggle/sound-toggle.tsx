import * as stylex from '@stylexjs/stylex';
import { useTranslation } from 'react-i18next';

export type SoundToggleProps = Readonly<{
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}>;

const styles = stylex.create({
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.625rem',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: '0.5rem',
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.75rem',
    lineHeight: 1.5,
    color: { default: '#b9c5d5', ':hover': '#f2eee4' },
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineColor: { default: 'transparent', ':focus-visible': '#e0cc9d' },
    outlineOffset: '6px',
  },
  indicator: {
    width: '0.375rem',
    height: '0.375rem',
    borderRadius: '50%',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'currentColor',
  },
  enabledIndicator: { backgroundColor: 'currentColor' },
});

/** The caller owns the sound preference, persistence and actual playback. */
export function SoundToggle({ isSoundEnabled, onToggleSound }: SoundToggleProps) {
  const { t } = useTranslation('intro', { keyPrefix: 'sound' });

  return (
    <button
      type="button"
      aria-pressed={isSoundEnabled}
      onClick={onToggleSound}
      {...stylex.props(styles.button)}
    >
      <span
        aria-hidden="true"
        {...stylex.props(styles.indicator, isSoundEnabled && styles.enabledIndicator)}
      />
      <span>
        {t('label')}{' '}
        {/* aria-pressed already exposes the state; keep the accessible name stable. */}
        <span aria-hidden="true">{t(isSoundEnabled ? 'enabled' : 'disabled')}</span>
      </span>
    </button>
  );
}
