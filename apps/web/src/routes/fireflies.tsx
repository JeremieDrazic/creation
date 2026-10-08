import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

function Page() {
  const { t } = useTranslation();
  return (
    <section>
      <h1>Fireflies</h1>
      <p>{t('firefliesWaiting')}</p>
    </section>
  );
}

export const Route = createFileRoute('/fireflies')({ component: Page });
