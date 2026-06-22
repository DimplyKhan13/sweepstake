import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCreateMatchMutation, useUpdateMatchMutation, useDeleteMatchMutation } from '../api/matchApi'
import { useListStagesQuery } from '../api/groupApi'
import { useListTeamsQuery } from '../api/teamApi'
import type { Match } from '../types'
import {
  BtnDanger,
  BtnPrimary,
  BtnSecondary,
  ErrorMsg,
  FieldLabel,
  ModalBackdrop,
  ModalBody,
  ModalBox,
  ModalFooter,
  ModalHeader,
  fieldClass,
} from './base'
import { TeamPickerModal } from './team'
import { AddTeamModal } from './team'
import { StageManagerModal } from './stage'

/** Ensure a server datetime string (possibly naive / no timezone) is parsed as UTC. */
function parseServerDt(dt: string): Date {
  const hasOffset = dt.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dt)
  return new Date(hasOffset ? dt : dt + 'Z')
}

function toDatetimeLocal(serverDt: string): string {
  const d = parseServerDt(serverDt)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

function fromDatetimeLocal(local: string): string {
  return new Date(local).toISOString()
}

// ---------------------------------------------------------------------------
// Team selector button (selected state vs empty state)
// ---------------------------------------------------------------------------

function TeamSelector({
  label,
  teamId,
  team,
  onPick,
  onClear,
  onAddNew,
  disabled,
}: {
  label: string
  teamId: string
  team: { name: string; image_url: string | null } | undefined
  onPick: () => void
  onClear: () => void
  onAddNew: () => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
        <button
          type="button"
          onClick={onAddNew}
          disabled={disabled}
          className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 disabled:opacity-40 transition"
          title="Add new team"
        >
          <Plus size={13} />
        </button>
      </div>
      {teamId ? (
        <button
          type="button"
          onClick={onPick}
          disabled={disabled}
          className="w-full flex items-center gap-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-left text-gray-900 dark:text-gray-100 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {team?.image_url ? (
            <img
              src={team.image_url}
              alt={team.name}
              decoding="async"
              className="h-5 w-5 flex-shrink-0 rounded-full object-cover border border-gray-200 dark:border-gray-700"
            />
          ) : (
            <span className="h-5 w-5 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 inline-block" />
          )}
          <span className="truncate flex-1">{team?.name ?? teamId}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear() }}
            disabled={disabled}
            className="text-gray-400 hover:text-red-500 disabled:opacity-40 transition flex-shrink-0"
            title="Clear"
          >
            <X size={12} />
          </button>
        </button>
      ) : (
        <button
          type="button"
          onClick={onPick}
          disabled={disabled}
          className="w-full rounded border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-400 dark:text-gray-500 hover:border-blue-400 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition text-left"
        >
          {t('match.selectTeam')}
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// MatchModal (create or edit)
// ---------------------------------------------------------------------------

export function MatchModal({
  tournamentId,
  match,
  onClose,
}: {
  tournamentId: number
  match?: Match
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data: teams = [] } = useListTeamsQuery(tournamentId)
  const { data: stages = [] } = useListStagesQuery(tournamentId)
  const [createMatch, { isLoading: isCreating }] = useCreateMatchMutation()
  const [updateMatch, { isLoading: isUpdating }] = useUpdateMatchMutation()
  const [deleteMatch, { isLoading: isDeleting }] = useDeleteMatchMutation()
  const isLoading = isCreating || isUpdating || isDeleting

  const [datetime, setDatetime] = useState(match ? toDatetimeLocal(match.start_datetime) : '')
  const [homeTeamId, setHomeTeamId] = useState(match?.home_team_id?.toString() ?? '')
  const [awayTeamId, setAwayTeamId] = useState(match?.away_team_id?.toString() ?? '')
  const [stageId, setStageId] = useState(match?.stage_id?.toString() ?? '')
  const [homeGoals, setHomeGoals] = useState(match?.home_goals?.toString() ?? '')
  const [awayGoals, setAwayGoals] = useState(match?.away_goals?.toString() ?? '')
  const [penaltyWinnerId, setPenaltyWinnerId] = useState(match?.penalty_winner_team_id?.toString() ?? '')
  const [tvChannel, setTvChannel] = useState(match?.tv_channel ?? '')
  const [error, setError] = useState<string | null>(null)
  const [teamPickerFor, setTeamPickerFor] = useState<'home' | 'away' | null>(null)
  const [addTeamFor, setAddTeamFor] = useState<'home' | 'away' | null>(null)
  const [showStageManager, setShowStageManager] = useState(false)

  async function handleSave() {
    setError(null)
    if (!datetime) {
      setError(t('match.startRequired'))
      return
    }
    try {
      if (match) {
        const isDraw =
          homeGoals !== '' && awayGoals !== '' && Number(homeGoals) === Number(awayGoals)
        await updateMatch({
          id: match.id,
          tournamentId,
          data: {
            start_datetime: fromDatetimeLocal(datetime),
            home_team_id: homeTeamId ? Number(homeTeamId) : undefined,
            away_team_id: awayTeamId ? Number(awayTeamId) : undefined,
            stage_id: stageId ? Number(stageId) : undefined,
            home_goals: homeGoals !== '' ? Number(homeGoals) : null,
            away_goals: awayGoals !== '' ? Number(awayGoals) : null,
            penalty_winner_team_id: isDraw && penaltyWinnerId ? Number(penaltyWinnerId) : null,
            tv_channel: tvChannel || null,
          },
        }).unwrap()
      } else {
        await createMatch({
          tournament_id: tournamentId,
          start_datetime: fromDatetimeLocal(datetime),
          home_team_id: homeTeamId ? Number(homeTeamId) : undefined,
          away_team_id: awayTeamId ? Number(awayTeamId) : undefined,
          stage_id: stageId ? Number(stageId) : undefined,
          home_goals: homeGoals !== '' ? Number(homeGoals) : undefined,
          away_goals: awayGoals !== '' ? Number(awayGoals) : undefined,
          tv_channel: tvChannel || undefined,
        }).unwrap()
      }
      onClose()
    } catch {
      setError(t('match.failedSave'))
    }
  }

  async function handleDelete() {
    if (!match) return
    if (
      !window.confirm(t('match.deleteConfirm'))
    )
      return
    setError(null)
    try {
      await deleteMatch({ id: match.id, tournamentId }).unwrap()
      onClose()
    } catch {
      setError(t('match.failedDelete'))
    }
  }

  const homeTeam = teams.find((t) => t.id === Number(homeTeamId))
  const awayTeam = teams.find((t) => t.id === Number(awayTeamId))

  return (
    <ModalBackdrop zIndex="z-50">
      {teamPickerFor && (
        <TeamPickerModal
          tournamentId={tournamentId}
          onSelect={(id) => {
            if (teamPickerFor === 'home') setHomeTeamId(String(id))
            else setAwayTeamId(String(id))
          }}
          onClose={() => setTeamPickerFor(null)}
        />
      )}
      {addTeamFor && (
        <AddTeamModal
          tournamentId={tournamentId}
          onCreated={(id) => {
            if (addTeamFor === 'home') setHomeTeamId(String(id))
            else setAwayTeamId(String(id))
          }}
          onClose={() => setAddTeamFor(null)}
        />
      )}
      <ModalBox>
        <ModalHeader title={match ? t('match.editMatch') : t('match.addMatch')} onClose={onClose} />
        <ModalBody scrollable>
          <div>
            <FieldLabel>{t('match.startDateTime')}</FieldLabel>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              disabled={isLoading}
              className={fieldClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TeamSelector
              label={t('match.homeTeam')}
              teamId={homeTeamId}
              team={homeTeam}
              onPick={() => setTeamPickerFor('home')}
              onClear={() => setHomeTeamId('')}
              onAddNew={() => setAddTeamFor('home')}
              disabled={isLoading}
            />
            <TeamSelector
              label={t('match.awayTeam')}
              teamId={awayTeamId}
              team={awayTeam}
              onPick={() => setTeamPickerFor('away')}
              onClear={() => setAwayTeamId('')}
              onAddNew={() => setAddTeamFor('away')}
              disabled={isLoading}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('match.stage')}</label>
              <button
                type="button"
                onClick={() => setShowStageManager(true)}
                disabled={isLoading}
                className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 disabled:opacity-40 transition"
                title="Manage stages"
              >
                <Plus size={13} />
              </button>
            </div>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              disabled={isLoading}
              className={fieldClass}
            >
              <option value="">{t('common.none')}</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          {showStageManager && (
            <StageManagerModal
              tournamentId={tournamentId}
              onClose={() => setShowStageManager(false)}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>{t('match.homeGoals')}</FieldLabel>
              <input
                type="number"
                min="0"
                value={homeGoals}
                onChange={(e) => setHomeGoals(e.target.value)}
                placeholder="—"
                disabled={isLoading}
                className={fieldClass}
              />
            </div>
            <div>
              <FieldLabel>{t('match.awayGoals')}</FieldLabel>
              <input
                type="number"
                min="0"
                value={awayGoals}
                onChange={(e) => setAwayGoals(e.target.value)}
                placeholder="—"
                disabled={isLoading}
                className={fieldClass}
              />
            </div>
          </div>
          {homeGoals !== '' && awayGoals !== '' && Number(homeGoals) === Number(awayGoals) && (
            <div>
              <FieldLabel>{t('match.penWinner')}</FieldLabel>
              <div className="flex gap-2">
                {[
                  { id: homeTeamId, team: homeTeam, label: t('match.homeTeam') },
                  { id: awayTeamId, team: awayTeam, label: t('match.awayTeam') },
                ].map(({ id, team, label }) => {
                  if (!id) return null
                  const selected = penaltyWinnerId === id
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => setPenaltyWinnerId(selected ? '' : id)}
                      className={[
                        'flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-sm font-medium transition disabled:opacity-50',
                        selected
                          ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600',
                      ].join(' ')}
                    >
                      {team?.image_url && (
                        <img
                          src={team.image_url}
                          alt={team.name}
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="h-4 w-4 rounded-full object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0"
                        />
                      )}
                      {team?.name ?? label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <div>
            <FieldLabel>{t('match.tvChannel')}</FieldLabel>
            <input
              type="text"
              value={tvChannel}
              onChange={(e) => setTvChannel(e.target.value)}
              placeholder={t('match.tvChannelPlaceholder')}
              disabled={isLoading}
              className={fieldClass}
            />
          </div>
          <ErrorMsg msg={error} />
        </ModalBody>
        <ModalFooter justify="between">
          <div>
            {match && (
              <BtnDanger onClick={handleDelete} disabled={isLoading} loading={isDeleting}>
                {isDeleting ? t('common.deleting') : t('common.delete')}
              </BtnDanger>
            )}
          </div>
          <div className="flex gap-2">
            <BtnSecondary onClick={onClose}>{t('common.cancel')}</BtnSecondary>
            <BtnPrimary onClick={handleSave} disabled={isLoading} loading={isCreating || isUpdating}>
              {isCreating || isUpdating ? t('common.saving') : t('common.save')}
            </BtnPrimary>
          </div>
        </ModalFooter>
      </ModalBox>
    </ModalBackdrop>
  )
}
