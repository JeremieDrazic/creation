import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/fireflies')({ component: Page });

function Page() {
  const { t } = useTranslation();
  return (
    <section>
      <h1>Fireflies</h1>
      <p>{t('firefliesWaiting')}</p>
    </section>
  );
}
