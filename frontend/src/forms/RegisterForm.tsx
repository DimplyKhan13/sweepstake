import { useState, type FormEvent } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRegisterMutation } from '../api/authApi'
import { getApiErrorMessage } from '../api/apiError'

function GreenTick() {
  return (
    <svg
      className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function RegisterForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { search } = useLocation()
  const [register, { isLoading, error }] = useRegisterMutation()
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '' })
  const [repeatEmail, setRepeatEmail] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [repeatEmailFocused, setRepeatEmailFocused] = useState(false)

  const emailFilled = form.email.length > 0
  const emailMatch = emailFilled && form.email === repeatEmail
  const showRepeatEmail = emailFilled && (!emailMatch || repeatEmailFocused)
  const emailMismatch = repeatEmail.length > 0 && !emailMatch

  const passwordFilled = form.password.length > 0
  const passwordMatch = passwordFilled && form.password === repeatPassword
  const showRepeatPassword = passwordFilled && !passwordMatch
  const passwordMismatch = repeatPassword.length > 0 && !passwordMatch

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!emailMatch || !passwordMatch) return
    try {
      await register(form).unwrap()
      navigate(`/overview${search}`)
    } catch {
      // error shown below
    }
  }

  const inputClass =
    'w-full rounded border border-gray-300 bg-white px-3 py-2 text-base sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-teal-400'
  const errorInputClass =
    'w-full rounded border border-red-500 bg-white px-3 py-2 text-base sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-500 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-red-400'

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <h1 className="text-3xl font-extrabold tracking-tight text-center text-gray-900 dark:text-white mb-2">
        Bolão da Copa
      </h1>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('auth.createAccount')}</h2>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{getApiErrorMessage(error, t('auth.registrationFailed'))}</p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.firstName')}</label>
        <input name="first_name" type="text" required value={form.first_name} onChange={handleChange} className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.lastName')}</label>
        <input name="last_name" type="text" value={form.last_name} onChange={handleChange} className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.email')}</label>
        <div className="relative">
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className={`${emailMismatch ? errorInputClass : inputClass} ${emailMatch ? 'pr-9' : ''}`}
          />
          {emailMatch && <GreenTick />}
        </div>
      </div>

      {showRepeatEmail && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.repeatEmail')}</label>
          <input
            name="repeatEmail"
            type="email"
            required
            value={repeatEmail}
            onChange={(e) => setRepeatEmail(e.target.value)}
            onFocus={() => setRepeatEmailFocused(true)}
            onBlur={() => setRepeatEmailFocused(false)}
            className={emailMismatch ? errorInputClass : inputClass}
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.password')}</label>
        <div className="relative">
          <input
            name="password"
            type="password"
            required
            value={form.password}
            onChange={handleChange}
            className={`${passwordMismatch ? errorInputClass : inputClass} ${passwordMatch ? 'pr-9' : ''}`}
          />
          {passwordMatch && <GreenTick />}
        </div>
      </div>

      {showRepeatPassword && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.repeatPassword')}</label>
          <input
            name="repeatPassword"
            type="password"
            required
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            className={passwordMismatch ? errorInputClass : inputClass}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !emailMatch || !passwordMatch}
        className="w-full rounded bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 dark:bg-teal-500 dark:hover:bg-teal-600"
      >
        {isLoading ? t('auth.creatingAccount') : t('auth.register')}
      </button>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        {t('auth.alreadyHaveAccount')}{' '}
        <Link to={`/login${search}`} className="text-teal-600 hover:underline dark:text-teal-400">
          {t('auth.signIn')}
        </Link>
      </p>
    </form>
  )
}
