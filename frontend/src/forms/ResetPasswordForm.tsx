import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useResetPasswordMutation } from '../api/authApi'
import { getApiErrorMessage } from '../api/apiError'

export function ResetPasswordForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [resetPassword, { isLoading, error }] = useResetPasswordMutation()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mismatch, setMismatch] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    try {
      await resetPassword({ token, new_password: newPassword }).unwrap()
      navigate('/login', { replace: true })
    } catch {
      // error shown below
    }
  }

  if (!token) {
    return (
      <div className="w-full space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-center text-gray-900 dark:text-white mb-2">
          Bolão da Copa
        </h1>
        <p className="text-sm text-red-600 dark:text-red-400">
          {t('auth.invalidResetLink')}
        </p>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          <Link to="/forgot-password" className="text-teal-600 hover:underline dark:text-teal-400">
            {t('auth.requestNewLink')}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <h1 className="text-3xl font-extrabold tracking-tight text-center text-gray-900 dark:text-white mb-2">
        Bolão da Copa
      </h1>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('auth.setNewPassword')}</h2>
      {(error || mismatch) && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {mismatch ? t('auth.passwordsMismatch') : getApiErrorMessage(error!, t('auth.resetFailed'))}
        </p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.newPassword')}</label>
        <input
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-base sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-teal-400"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.confirmNewPassword')}</label>
        <input
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-base sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-teal-400"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !newPassword || !confirmPassword}
        className="w-full rounded bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 dark:bg-teal-500 dark:hover:bg-teal-600"
      >
        {isLoading ? t('auth.saving') : t('auth.setNewPassword')}
      </button>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        <Link to="/login" className="text-teal-600 hover:underline dark:text-teal-400">
          {t('auth.backToSignIn')}
        </Link>
      </p>
    </form>
  )
}
