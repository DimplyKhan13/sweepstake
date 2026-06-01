import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalShell, ModalBody } from '../modals/base'
import { useGetConfigQuery } from '../api/configApi'
import { LanguageSwitcher } from './LanguageSwitcher'

type ModalType = 'credits' | 'privacy' | null

export function Footer() {
  const { t } = useTranslation()
  const [open, setOpen] = useState<ModalType>(null)
  const { data: config } = useGetConfigQuery()

  return (
    <>
      <footer className="w-full bg-black text-gray-400 text-xs py-3 px-4 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => setOpen('credits')}
          className="hover:text-white transition-colors"
        >
          {t('footer.credits')}
        </button>
        <button
          type="button"
          onClick={() => setOpen('privacy')}
          className="hover:text-white transition-colors"
        >
          {t('footer.yourData')}
        </button>
        <a
          href="https://github.com/vanalmsick/sweepstake"
          target="_blank"
          rel="noopener"
          className="hover:text-white transition-colors"
        >
          {t('footer.openSource')}
        </a>
        <LanguageSwitcher />
      </footer>

      {open === 'credits' && (
        <ModalShell title={t('footer.credits')} onClose={() => setOpen(null)}>
          <ModalBody>
            <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
              <li>
                {t('footer.creditsLicense')}{' '}
                <strong>SSPL v1.0</strong>{' '}
                on{' '}
                <a
                  href="https://github.com/vanalmsick/sweepstake"
                  target="_blank"
                  rel="noopener"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  github.com/vanalmsick/sweepstake
                </a>
                .
              </li>
              <li>
                {t('footer.creditsBackground')}{' '}
                <a
                  href="https://unsplash.com/photos/soccer-field-qCrKTET_09o"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  unsplash.com
                </a>
                .
              </li>
              <li>
                {t('footer.creditsLogo')}{' '}
                <a
                  href="https://www.svgrepo.com/svg/390331/football-ball-soccer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  svgrepo.com
                </a>
                .
              </li>
              <li>{t('footer.creditsTeamImages')}</li>
              <li>
                {t('footer.creditsTailwind')}{' '}
                <a
                  href="https://lucide.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Lucide
                </a>{' '}
                {t('footer.creditsForReact')}
              </li>
            </ul>
          </ModalBody>
        </ModalShell>
      )}

      {open === 'privacy' && (
        <ModalShell
          title={t('footer.yourData')}
          onClose={() => setOpen(null)}
          maxWidth="max-w-lg"
        >
          <ModalBody>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('footer.privacyNoSell')}
            </p>
            {config?.sentry_dsn && (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                <a
                  href="https://sentry.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Sentry.io
                </a>{' '}
                {t('footer.privacySentry')}
              </p>
            )}
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('footer.privacyNoAnalytics')}
            </p>
          </ModalBody>
        </ModalShell>
      )}
    </>
  )
}
