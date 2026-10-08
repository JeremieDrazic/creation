import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/')({ component: Page });

function Page() {
  const { t } = useTranslation();
  return (
    <section>
      <h1>Creation</h1>
      <p>{t('waiting')}</p>
    </section>
  );
}
