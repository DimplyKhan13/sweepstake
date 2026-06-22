import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ModalShell, ModalBody } from './base'
import { useGetMatchStatsQuery } from '../api/statsApi'
import { formatDateTime } from '../utils/datetime'
import { useAppSelector } from '../store/hooks'
import type { Match } from '../types'

export function MatchStatsModal({
  matchId,
  tournamentId,
  match,
  onClose,
}: {
  matchId: number
  tournamentId: number
  match: Match | undefined
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data: stats, isLoading, error } = useGetMatchStatsQuery(matchId)
  const navigate = useNavigate()
  const currentUserId = useAppSelector((state) => state.auth.user?.id)

  const homeTeam = match?.home_team?.name ?? '?'
  const awayTeam = match?.away_team?.name ?? '?'

  return (
    <ModalShell title={`${homeTeam} vs ${awayTeam}`} onClose={onClose} maxWidth="max-w-lg">
      <ModalBody scrollable>
        {isLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('matchStats.loading')}</p>
        )}
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{t('matchStats.failedLoad')}</p>
        )}
        {stats && (
          <div className="space-y-5">
            <div className="text-center py-1">
              <span className="text-3xl font-bold font-mono text-gray-900 dark:text-gray-100">
                {stats.home_goals != null && stats.away_goals != null
                  ? `${stats.home_goals} – ${stats.away_goals}`
                  : '– : –'}
              </span>
              {stats.penalty_winner_team_id != null && (
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                  {t('matchStats.penaltiesLabel')} {
                    stats.penalty_winner_team_id === match?.home_team_id
                      ? (match?.home_team?.name ?? '?')
                      : (match?.away_team?.name ?? '?')
                  }
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('matchStats.finalScore')}</p>
              {stats.start_datetime && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {formatDateTime(stats.start_datetime)}
                </p>
              )}
            </div>

            {stats.predictions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('matchStats.noPredictions')}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left pb-2 font-medium text-gray-500 dark:text-gray-400">
                      {t('matchStats.player')}
                    </th>
                    <th className="text-center pb-2 font-medium text-gray-500 dark:text-gray-400">
                      {t('matchStats.prediction')}
                    </th>
                    {stats.penalty_winner_team_id != null && (
                      <th className="text-center pb-2 font-medium text-gray-500 dark:text-gray-400">
                        {t('matchStats.penPick')}
                      </th>
                    )}
                    <th className="text-right pb-2 font-medium text-gray-500 dark:text-gray-400">
                      {t('matchStats.points')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {stats.predictions
                    .slice()
                    .sort((a, b) => (b.points_earned ?? -1) - (a.points_earned ?? -1))
                    .map((p) => {
                      const penPickTeam = p.penalty_winner_team_id != null
                        ? (p.penalty_winner_team_id === match?.home_team_id ? match?.home_team : match?.away_team)
                        : (p.home_score != null && p.away_score != null && p.home_score !== p.away_score)
                          ? (p.home_score > p.away_score ? match?.home_team : match?.away_team)
                          : null
                      return (
                      <tr
                        key={p.user_id}
                        onClick={() => {
                          onClose()
                          navigate(`/tournament/${tournamentId}/predictions/${p.user_id}`)
                        }}
                        className={`cursor-pointer transition hover:bg-gray-100 dark:hover:bg-gray-700/50 ${
                          p.user_id === currentUserId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        aria-label={`View ${p.user_name ?? 'user'}'s predictions`}
                      >
                        <td className="py-2.5 px-3 text-gray-900 dark:text-gray-100">
                          <span className="inline-flex items-center gap-1.5">
                            {p.user_name ?? '—'}
                            <Search size={13} className="text-gray-400 flex-shrink-0" />
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-gray-700 dark:text-gray-300">
                          {p.home_score != null && p.away_score != null
                            ? `${p.home_score} – ${p.away_score}`
                            : '—'}
                        </td>
                        {stats.penalty_winner_team_id != null && (
                          <td className="py-2.5 px-3 text-center">
                            {penPickTeam ? (
                              <span className="inline-flex items-center gap-1">
                                {penPickTeam.image_url && (
                                  <img src={penPickTeam.image_url} alt={penPickTeam.name} decoding="async" referrerPolicy="no-referrer" className="h-3.5 w-3.5 rounded-full object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0" />
                                )}
                                <span className={p.penalty_winner_team_id === stats.penalty_winner_team_id || (!p.penalty_winner_team_id && penPickTeam.id === stats.penalty_winner_team_id) ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                                  {penPickTeam.iso_code ?? penPickTeam.name}
                                </span>
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-right">
                          {p.points_earned != null ? (
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              +{p.points_earned}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">—</span>
                          )}
                        </td>
                      </tr>
                    )})}

                </tbody>
              </table>
            )}
          </div>
        )}
      </ModalBody>
    </ModalShell>
  )
}
