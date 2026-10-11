import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

function Page() {
  const { t } = useTranslation();
  return (
    <section>
      <h1>Creation</h1>
      <p>{t('waiting')}</p>
    </section>
  );
}

export const Route = createFileRoute('/')({ component: Page });
