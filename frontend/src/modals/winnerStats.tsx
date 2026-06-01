import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ModalShell, ModalBody } from './base'
import {
  useGetGroupStatsQuery,
  useGetStageStatsQuery,
  useGetTournamentStatsQuery,
} from '../api/statsApi'
import { useAppSelector } from '../store/hooks'
import type { WinnerPredictionGroup } from '../types'

// ---------------------------------------------------------------------------
// Shared predictions table
// ---------------------------------------------------------------------------
function WinnerPredictionsTable({
  predictions,
  tournamentId,
  onClose,
}: {
  predictions: WinnerPredictionGroup[]
  tournamentId: number
  onClose: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentUserId = useAppSelector((state) => state.auth.user?.id)

  if (predictions.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">{t('winnerStats.noPredictions')}</p>
    )
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
      {predictions.map((group, i) => (
        <div key={group.id ?? `none-${i}`} className="py-3 first:pt-0 last:pb-0">
          {/* Team header */}
          <div className="flex items-center gap-2 mb-2">
            {group.image_url ? (
              <img
                src={group.image_url}
                alt={group.name ?? ''}
                decoding="async"
                className="h-5 w-5 flex-shrink-0 rounded-full object-cover border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <span className="h-5 w-5 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 inline-block" />
            )}
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {group.name ?? 'No prediction'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              ({group.users.length})
            </span>
          </div>

          {/* Users */}
          <ul className="space-y-1 pl-7">
            {group.users.map((u) => (
              <li key={u.user_id}>
                <button
                  onClick={() => {
                    onClose()
                    navigate(`/tournament/${tournamentId}/predictions/${u.user_id}`)
                  }}
                  className={`w-full flex items-center justify-between text-sm rounded px-2 py-0.5 -mx-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition ${
                    u.user_id === currentUserId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  aria-label={`View ${u.user_name ?? 'user'}'s predictions`}
                >
                  <span className="inline-flex items-center gap-1.5 text-gray-800 dark:text-gray-200">
                    {u.user_name ?? '—'}
                    <Search size={13} className="text-gray-400" />
                  </span>
                  {u.points_earned != null ? (
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      +{u.points_earned}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">—</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Actual-result badge (Group / Stage)
// ---------------------------------------------------------------------------
function WinnerBadge({ team }: { team: { name: string; image_url: string | null } | null | undefined }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center gap-2.5 py-1">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('winnerStats.winner')}</span>
      {team ? (
        <span className="inline-flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
          {team.image_url && (
            <img
              src={team.image_url}
              alt={team.name}
              decoding="async"
              className="h-7 w-7 rounded-full object-cover border border-gray-200 dark:border-gray-700"
            />
          )}
          {team.name}
        </span>
      ) : (
        <span className="text-base text-gray-400 dark:text-gray-500 italic">{t('winnerStats.notDecided')}</span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// GroupStatsModal
// ---------------------------------------------------------------------------
export function GroupStatsModal({
  groupId,
  groupName,
  tournamentId,
  onClose,
}: {
  groupId: number
  groupName: string
  tournamentId: number
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data: stats, isLoading, error } = useGetGroupStatsQuery(groupId)

  return (
    <ModalShell title={t('winnerStats.predictionsTitle', { name: groupName })} onClose={onClose} maxWidth="max-w-lg">
      <ModalBody scrollable>
        {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">{t('winnerStats.loading')}</p>}
        {error && <p className="text-sm text-red-500 dark:text-red-400">{t('winnerStats.failedGroup')}</p>}
        {stats && (
          <div className="space-y-4">
            <WinnerBadge team={stats.actual_winner_team} />
            <WinnerPredictionsTable
              predictions={stats.predictions}
              tournamentId={tournamentId}
              onClose={onClose}
            />
          </div>
        )}
      </ModalBody>
    </ModalShell>
  )
}

// ---------------------------------------------------------------------------
// StageStatsModal
// ---------------------------------------------------------------------------
export function StageStatsModal({
  stageId,
  stageName,
  tournamentId,
  onClose,
}: {
  stageId: number
  stageName: string
  tournamentId: number
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data: stats, isLoading, error } = useGetStageStatsQuery(stageId)

  return (
    <ModalShell title={t('winnerStats.predictionsTitle', { name: stageName })} onClose={onClose} maxWidth="max-w-lg">
      <ModalBody scrollable>
        {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">{t('winnerStats.loading')}</p>}
        {error && <p className="text-sm text-red-500 dark:text-red-400">{t('winnerStats.failedStage')}</p>}
        {stats && (
          <div className="space-y-4">
            <WinnerBadge team={stats.actual_winner_team} />
            <WinnerPredictionsTable
              predictions={stats.predictions}
              tournamentId={tournamentId}
              onClose={onClose}
            />
          </div>
        )}
      </ModalBody>
    </ModalShell>
  )
}

// ---------------------------------------------------------------------------
// TournamentStatsModal
// ---------------------------------------------------------------------------
export function TournamentStatsModal({
  tournamentId,
  tournamentName,
  onClose,
}: {
  tournamentId: number
  tournamentName: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data: stats, isLoading, error } = useGetTournamentStatsQuery(tournamentId)

  function PlaceRow({
    emoji,
    team,
    emojiSize,
    textSize,
    imgSize,
  }: {
    emoji: string
    team: { name: string; image_url: string | null } | null | undefined
    emojiSize: string
    textSize: string
    imgSize: string
  }) {
    return (
      <div className="flex items-center gap-2.5">
        <span className={emojiSize}>{emoji}</span>
        {team ? (
          <span className={`inline-flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100 ${textSize}`}>
            {team.image_url && (
              <img
                src={team.image_url}
                alt={team.name}
                decoding="async"
                className={`${imgSize} rounded-full object-cover border border-gray-200 dark:border-gray-700`}
              />
            )}
            {team.name}
          </span>
        ) : (
          <span className={`text-gray-400 dark:text-gray-500 italic ${textSize}`}>{t('winnerStats.notDecided')}</span>
        )}
      </div>
    )
  }

  return (
    <ModalShell title={t('winnerStats.winnerPredictionsTitle', { name: tournamentName })} onClose={onClose} maxWidth="max-w-lg">
      <ModalBody scrollable>
        {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">{t('winnerStats.loading')}</p>}
        {error && <p className="text-sm text-red-500 dark:text-red-400">{t('winnerStats.failedTournament')}</p>}
        {stats && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 py-1">
              <PlaceRow emoji="🥇" team={stats.first_place_team} emojiSize="text-xl" textSize="text-lg" imgSize="h-7 w-7" />
              <PlaceRow emoji="🥈" team={stats.second_place_team} emojiSize="text-lg" textSize="text-base" imgSize="h-6 w-6" />
              <PlaceRow emoji="🥉" team={stats.third_place_team} emojiSize="text-base" textSize="text-sm" imgSize="h-5 w-5" />
            </div>
            <WinnerPredictionsTable
              predictions={stats.predictions}
              tournamentId={tournamentId}
              onClose={onClose}
            />
          </div>
        )}
      </ModalBody>
    </ModalShell>
  )
}
