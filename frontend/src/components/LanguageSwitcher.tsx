import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language.startsWith('pt') ? 'pt-BR' : 'en'

  function toggle() {
    i18n.changeLanguage(current === 'en' ? 'pt-BR' : 'en')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition tabular-nums"
      title={current === 'en' ? 'Switch to Português' : 'Switch to English'}
    >
      {current === 'en' ? '🇧🇷 PT' : '🇬🇧 EN'}
    </button>
  )
}
