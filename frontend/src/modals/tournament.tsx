import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellRing, CircleDollarSign, Crown, Loader2, RefreshCw, UserX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  useCreateTournamentMutation,
  useUpdateTournamentMutation,
  useDeleteTournamentMutation,
  useManageTournamentMemberMutation,
  useSetStakePaidMutation,
  useSendAdminActionMutation,
} from '../api/tournamentApi'
import type { TournamentAdminAction } from '../types'
import { useListFootballDataOrgTournamentsQuery } from '../api/footballDataOrgApi'
import { useListTeamsQuery } from '../api/teamApi'
import { useGetMeQuery } from '../api/authApi'
import type { Tournament } from '../types'
import {
  BtnDanger,
  BtnPrimary,
  BtnSecondary,
  ErrorMsg,
  FieldLabel,
  ModalBody,
  ModalFooter,
  ModalShell,
  fieldClass,
} from './base'

// ---------------------------------------------------------------------------
// Shared point-scoring fields used by both Create and Edit
// ---------------------------------------------------------------------------

type PointState = {
  firstPlacePoints: string
  setFirstPlacePoints: (v: string) => void
  secondPlacePoints: string
  setSecondPlacePoints: (v: string) => void
  thirdPlacePoints: string
  setThirdPlacePoints: (v: string) => void
  matchWinnerPoints: string
  setMatchWinnerPoints: (v: string) => void
  matchScorePoints: string
  setMatchScorePoints: (v: string) => void
  groupWinnerPoints: string
  setGroupWinnerPoints: (v: string) => void
  stageWinnerPoints: string
  setStageWinnerPoints: (v: string) => void
}

function PointFields(p: PointState & { disabled?: boolean }) {
  const { t } = useTranslation()
  const fields = [
    { label: t('createTournament.firstPlacePoints'), value: p.firstPlacePoints, set: p.setFirstPlacePoints },
    { label: t('createTournament.secondPlacePoints'), value: p.secondPlacePoints, set: p.setSecondPlacePoints },
    { label: t('createTournament.thirdPlacePoints'), value: p.thirdPlacePoints, set: p.setThirdPlacePoints },
    { label: t('createTournament.matchWinnerPoints'), value: p.matchWinnerPoints, set: p.setMatchWinnerPoints },
    { label: t('createTournament.exactScorePoints'), value: p.matchScorePoints, set: p.setMatchScorePoints },
    { label: t('createTournament.groupWinnerPoints'), value: p.groupWinnerPoints, set: p.setGroupWinnerPoints },
    { label: t('createTournament.stageWinnerPoints'), value: p.stageWinnerPoints, set: p.setStageWinnerPoints },
  ]
  return (
    <div className="grid grid-cols-2 gap-3">
      {fields.map(({ label, value, set }) => (
        <div key={label}>
          <FieldLabel>{label}</FieldLabel>
          <input
            type="number"
            min="0"
            value={value}
            onChange={(e) => set(e.target.value)}
            placeholder="—"
            disabled={p.disabled}
            className={fieldClass}
          />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Edit-only: point fields interleaved with team winner dropdowns
// ---------------------------------------------------------------------------

type EditPointAndTeamState = PointState & {
  tournamentId: number
  firstPlaceTeamId: string
  setFirstPlaceTeamId: (v: string) => void
  secondPlaceTeamId: string
  setSecondPlaceTeamId: (v: string) => void
  thirdPlaceTeamId: string
  setThirdPlaceTeamId: (v: string) => void
  disabled?: boolean
}

function EditPointAndTeamFields(p: EditPointAndTeamState) {
  const { t } = useTranslation()
  const { data: teams = [], isLoading: teamsLoading } = useListTeamsQuery(p.tournamentId)

  const teamSelect = (value: string, set: (v: string) => void) =>
    teamsLoading ? (
      <div className={`${fieldClass} flex items-center gap-2 text-gray-400 dark:text-gray-500`}>
        <Loader2 className="animate-spin h-4 w-4 flex-shrink-0" />
        <span className="text-sm">{t('createTournament.loadingTeams')}</span>
      </div>
    ) : (
      <select
        value={value}
        onChange={(e) => set(e.target.value)}
        disabled={p.disabled}
        className={fieldClass}
      >
        <option value="">{t('common.none')}</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    )

  const numInput = (value: string, set: (v: string) => void) => (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => set(e.target.value)}
      placeholder="—"
      disabled={p.disabled}
      className={fieldClass}
    />
  )

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <FieldLabel>{t('createTournament.firstPlacePoints')}</FieldLabel>
        {numInput(p.firstPlacePoints, p.setFirstPlacePoints)}
      </div>
      <div>
        <FieldLabel>{t('createTournament.firstPlaceWinner')}</FieldLabel>
        {teamSelect(p.firstPlaceTeamId, p.setFirstPlaceTeamId)}
      </div>
      <div>
        <FieldLabel>{t('createTournament.secondPlacePoints')}</FieldLabel>
        {numInput(p.secondPlacePoints, p.setSecondPlacePoints)}
      </div>
      <div>
        <FieldLabel>{t('createTournament.secondPlaceWinner')}</FieldLabel>
        {teamSelect(p.secondPlaceTeamId, p.setSecondPlaceTeamId)}
      </div>
      <div>
        <FieldLabel>{t('createTournament.thirdPlacePoints')}</FieldLabel>
        {numInput(p.thirdPlacePoints, p.setThirdPlacePoints)}
      </div>
      <div>
        <FieldLabel>{t('createTournament.thirdPlaceWinner')}</FieldLabel>
        {teamSelect(p.thirdPlaceTeamId, p.setThirdPlaceTeamId)}
      </div>
      <div>
        <FieldLabel>{t('createTournament.stageWinnerPoints')}</FieldLabel>
        {numInput(p.stageWinnerPoints, p.setStageWinnerPoints)}
      </div>
      <div>
        <FieldLabel>{t('createTournament.groupWinnerPoints')}</FieldLabel>
        {numInput(p.groupWinnerPoints, p.setGroupWinnerPoints)}
      </div>
      <div>
        <FieldLabel>{t('createTournament.exactScorePoints')}</FieldLabel>
        {numInput(p.matchScorePoints, p.setMatchScorePoints)}
      </div>
      <div>
        <FieldLabel>{t('createTournament.matchWinnerPoints')}</FieldLabel>
        {numInput(p.matchWinnerPoints, p.setMatchWinnerPoints)}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared tournament info fields (name, stake, fdo tournament)
// ---------------------------------------------------------------------------

function TournamentInfoFields({
  name,
  setName,
  stake,
  setStake,
  footballDataOrgId,
  setFootballDataOrgId,
  autoFocusName,
  disabled,
}: {
  name: string
  setName: (v: string) => void
  stake: string
  setStake: (v: string) => void
  footballDataOrgId: string
  setFootballDataOrgId: (v: string) => void
  autoFocusName?: boolean
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const { data: fdoTournaments, isLoading: fdoLoading } = useListFootballDataOrgTournamentsQuery()
  return (
    <>
      <div>
        <FieldLabel>{t('createTournament.name')}</FieldLabel>
        <input
          autoFocus={autoFocusName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled}
          className={fieldClass}
        />
      </div>
      <div>
        <FieldLabel>{t('createTournament.stakePrize')} <i>({t('createTournament.stakeEmpty')})</i></FieldLabel>
        <textarea
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          rows={3}
          placeholder={t('createTournament.stakePlaceholder')}
          disabled={disabled}
          className={`${fieldClass} resize-y`}
        />
      </div>
      <div>
        <FieldLabel>{t('createTournament.fdoTournament')} <i>({t('createTournament.fdoRecommended')})</i></FieldLabel>
        {fdoLoading ? (
          <div className={`${fieldClass} flex items-center gap-2 text-gray-400 dark:text-gray-500`}>
            <Loader2 className="animate-spin h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{t('createTournament.loadingTournaments')}</span>
          </div>
        ) : (
          <select
            value={footballDataOrgId}
            onChange={(e) => setFootballDataOrgId(e.target.value)}
            disabled={disabled}
            className={fieldClass}
          >
            <option value="">{t('common.none')}</option>
            {fdoTournaments?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// CreateTournamentModal
// ---------------------------------------------------------------------------

export function CreateTournamentModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [createTournament, { isLoading }] = useCreateTournamentMutation()

  const [name, setName] = useState('')
  const [stake, setStake] = useState("Please contribute a €5 stake to the pot. The SweepStake winner receives 50% of the pot, with the remaining 50% donated to a charity of the winner's choosing.\nwww.PayPal.com/{your_name/5\n[Remove this text entirely if there is no stake.]")
  const [footballDataOrgId, setFootballDataOrgId] = useState('')
  const [firstPlacePoints, setFirstPlacePoints] = useState('25')
  const [secondPlacePoints, setSecondPlacePoints] = useState('15')
  const [thirdPlacePoints, setThirdPlacePoints] = useState('')
  const [matchWinnerPoints, setMatchWinnerPoints] = useState('3')
  const [matchScorePoints, setMatchScorePoints] = useState('5')
  const [groupWinnerPoints, setGroupWinnerPoints] = useState('8')
  const [stageWinnerPoints, setStageWinnerPoints] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim()) return
    setError(null)
    try {
      const tournament = await createTournament({
        name: name.trim(),
        stake: stake.trim() || null,
        football_data_org_id: footballDataOrgId !== '' ? Number(footballDataOrgId) : undefined,
        first_place_points: firstPlacePoints !== '' ? Number(firstPlacePoints) : undefined,
        second_place_points: secondPlacePoints !== '' ? Number(secondPlacePoints) : undefined,
        third_place_points: thirdPlacePoints !== '' ? Number(thirdPlacePoints) : undefined,
        match_winner_points: matchWinnerPoints !== '' ? Number(matchWinnerPoints) : undefined,
        match_score_points: matchScorePoints !== '' ? Number(matchScorePoints) : undefined,
        group_winner_points: groupWinnerPoints !== '' ? Number(groupWinnerPoints) : undefined,
        stage_winner_points: stageWinnerPoints !== '' ? Number(stageWinnerPoints) : undefined,
      }).unwrap()
      onClose()
      navigate(`/tournament/${tournament.id}?guide=admin`)
    } catch {
      setError(t('createTournament.failedCreate'))
    }
  }

  return (
    <ModalShell title={t('createTournament.title')} onClose={onClose}>
      <ModalBody scrollable>
        <TournamentInfoFields
          name={name}
          setName={setName}
          stake={stake}
          setStake={setStake}
          footballDataOrgId={footballDataOrgId}
          setFootballDataOrgId={setFootballDataOrgId}
          autoFocusName
          disabled={isLoading}
        />
        <PointFields
          firstPlacePoints={firstPlacePoints}
          setFirstPlacePoints={setFirstPlacePoints}
          secondPlacePoints={secondPlacePoints}
          setSecondPlacePoints={setSecondPlacePoints}
          thirdPlacePoints={thirdPlacePoints}
          setThirdPlacePoints={setThirdPlacePoints}
          matchWinnerPoints={matchWinnerPoints}
          setMatchWinnerPoints={setMatchWinnerPoints}
          matchScorePoints={matchScorePoints}
          setMatchScorePoints={setMatchScorePoints}
          groupWinnerPoints={groupWinnerPoints}
          setGroupWinnerPoints={setGroupWinnerPoints}
          stageWinnerPoints={stageWinnerPoints}
          setStageWinnerPoints={setStageWinnerPoints}
          disabled={isLoading}
        />
        <ErrorMsg msg={error} />
      </ModalBody>
      <ModalFooter>
        <BtnSecondary onClick={onClose}>{t('common.cancel')}</BtnSecondary>
        <BtnPrimary onClick={handleCreate} disabled={isLoading || !name.trim()} loading={isLoading}>
          {isLoading ? t('common.creating') : t('common.create')}
        </BtnPrimary>
      </ModalFooter>
    </ModalShell>
  )
}

// ---------------------------------------------------------------------------
// EditTournamentModal
// ---------------------------------------------------------------------------

export function EditTournamentModal({
  tournament,
  onClose,
}: {
  tournament: Tournament
  onClose: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: me } = useGetMeQuery()
  const [updateTournament, { isLoading: isSaving }] = useUpdateTournamentMutation()
  const [deleteTournament, { isLoading: isDeleting }] = useDeleteTournamentMutation()
  const [manageMember] = useManageTournamentMemberMutation()
  const [setStakePaid] = useSetStakePaidMutation()
  const [sendAdminAction, { isLoading: isActionLoading }] = useSendAdminActionMutation()
  const [currentAction, setCurrentAction] = useState<TournamentAdminAction | null>(null)
  const isLoading = isSaving || isDeleting

  const COOLDOWN_MS = 30 * 60 * 1000
  const lsKey = (action: TournamentAdminAction) => `action_cooldown_${tournament.id}_${action}`
  const [lastTriggered, setLastTriggered] = useState<Partial<Record<TournamentAdminAction, number>>>(() => {
    const actions: TournamentAdminAction[] = ['send-payment-reminder', 'update-tournament', 'send-welcome-email']
    return Object.fromEntries(
      actions.flatMap((a) => {
        const v = localStorage.getItem(lsKey(a))
        return v ? [[a, parseInt(v, 10)]] : []
      })
    )
  })
  function minsLeft(action: TournamentAdminAction): number | null {
    const ts = lastTriggered[action]
    if (!ts) return null
    const left = COOLDOWN_MS - (Date.now() - ts)
    return left > 0 ? Math.ceil(left / 60_000) : null
  }

  const [name, setName] = useState(tournament.name)
  const [stake, setStake] = useState(tournament.stake ?? '')
  const [footballDataOrgId, setFootballDataOrgId] = useState(
    tournament.football_data_org_id?.toString() ?? '',
  )
  const [firstPlacePoints, setFirstPlacePoints] = useState(
    tournament.first_place_points?.toString() ?? '',
  )
  const [secondPlacePoints, setSecondPlacePoints] = useState(
    tournament.second_place_points?.toString() ?? '',
  )
  const [thirdPlacePoints, setThirdPlacePoints] = useState(
    tournament.third_place_points?.toString() ?? '',
  )
  const [matchWinnerPoints, setMatchWinnerPoints] = useState(
    tournament.match_winner_points?.toString() ?? '',
  )
  const [matchScorePoints, setMatchScorePoints] = useState(
    tournament.match_score_points?.toString() ?? '',
  )
  const [groupWinnerPoints, setGroupWinnerPoints] = useState(
    tournament.group_winner_points?.toString() ?? '',
  )
  const [stageWinnerPoints, setStageWinnerPoints] = useState(
    tournament.stage_winner_points?.toString() ?? '',
  )
  const [firstPlaceTeamId, setFirstPlaceTeamId] = useState(
    tournament.first_place_team_id?.toString() ?? '',
  )
  const [secondPlaceTeamId, setSecondPlaceTeamId] = useState(
    tournament.second_place_team_id?.toString() ?? '',
  )
  const [thirdPlaceTeamId, setThirdPlaceTeamId] = useState(
    tournament.third_place_team_id?.toString() ?? '',
  )
  const [error, setError] = useState<string | null>(null)
  const [memberError, setMemberError] = useState<string | null>(null)

  async function handleToggleStakePaid(userId: number, isCurrentlyPaid: boolean) {
    setMemberError(null)
    try {
      await setStakePaid({
        id: tournament.id,
        data: { user_id: userId, stake_paid: !isCurrentlyPaid },
      }).unwrap()
    } catch {
      setMemberError(t('createTournament.failedStakePaid'))
    }
  }

  async function handleToggleAdmin(userId: number, isCurrentlyAdmin: boolean) {
    if (
      isCurrentlyAdmin &&
      userId === me?.id &&
      !window.confirm(t('createTournament.removeAdminConfirm'))
    )
      return
    setMemberError(null)
    try {
      await manageMember({
        id: tournament.id,
        data: { user_id: userId, role: 'admin', action: isCurrentlyAdmin ? 'remove' : 'add' },
      }).unwrap()
    } catch {
      setMemberError(t('createTournament.failedAdmin'))
    }
  }

  async function handleRemoveParticipant(userId: number, isCurrentlyAdmin: boolean) {
    const isSelf = userId === me?.id
    const displayName =
      tournament.participant_lst.find((p) => p.id === userId)?.user_name ?? `User #${userId}`
    const message = isSelf
      ? t('createTournament.removeSelfConfirm')
      : t('createTournament.removeUserConfirm', { name: displayName })
    if (!window.confirm(message)) return
    setMemberError(null)
    try {
      if (isCurrentlyAdmin) {
        await manageMember({
          id: tournament.id,
          data: { user_id: userId, role: 'admin', action: 'remove' },
        }).unwrap()
      }
      await manageMember({
        id: tournament.id,
        data: { user_id: userId, role: 'participant', action: 'remove' },
      }).unwrap()
      if (isSelf) {
        onClose()
        navigate('/overview')
      }
    } catch {
      setMemberError(t('createTournament.failedRemove'))
    }
  }

  async function handleAdminAction(action: TournamentAdminAction) {
    setError(null)
    setCurrentAction(action)
    try {
      await sendAdminAction({ id: tournament.id, action }).unwrap()
      const now = Date.now()
      localStorage.setItem(lsKey(action), String(now))
      setLastTriggered((prev) => ({ ...prev, [action]: now }))
    } catch {
      setError(t('createTournament.failedAction'))
    } finally {
      setCurrentAction(null)
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(t('createTournament.deleteConfirm', { name: tournament.name }))
    )
      return
    setError(null)
    try {
      await deleteTournament(tournament.id).unwrap()
      onClose()
      navigate('/overview')
    } catch {
      setError(t('createTournament.failedDelete'))
    }
  }

  async function handleSave() {
    setError(null)
    try {
      await updateTournament({
        id: tournament.id,
        data: {
          name: name || undefined,
          stake: stake.trim() || null,
          football_data_org_id: footballDataOrgId !== '' ? Number(footballDataOrgId) : undefined,
          first_place_team_id: firstPlaceTeamId !== '' ? Number(firstPlaceTeamId) : undefined,
          second_place_team_id: secondPlaceTeamId !== '' ? Number(secondPlaceTeamId) : undefined,
          third_place_team_id: thirdPlaceTeamId !== '' ? Number(thirdPlaceTeamId) : undefined,
          first_place_points: firstPlacePoints !== '' ? Number(firstPlacePoints) : undefined,
          second_place_points: secondPlacePoints !== '' ? Number(secondPlacePoints) : undefined,
          third_place_points: thirdPlacePoints !== '' ? Number(thirdPlacePoints) : undefined,
          match_winner_points: matchWinnerPoints !== '' ? Number(matchWinnerPoints) : undefined,
          match_score_points: matchScorePoints !== '' ? Number(matchScorePoints) : undefined,
          group_winner_points: groupWinnerPoints !== '' ? Number(groupWinnerPoints) : undefined,
          stage_winner_points: stageWinnerPoints !== '' ? Number(stageWinnerPoints) : undefined,
        },
      }).unwrap()
      onClose()
    } catch {
      setError(t('createTournament.failedSave'))
    }
  }

  return (
    <ModalShell title={t('createTournament.editTitle')} onClose={onClose}>
      <ModalBody scrollable>
        <TournamentInfoFields
          name={name}
          setName={setName}
          stake={stake}
          setStake={setStake}
          footballDataOrgId={footballDataOrgId}
          setFootballDataOrgId={setFootballDataOrgId}
          disabled={isLoading}
        />
        <EditPointAndTeamFields
          tournamentId={tournament.id}
          firstPlacePoints={firstPlacePoints}
          setFirstPlacePoints={setFirstPlacePoints}
          secondPlacePoints={secondPlacePoints}
          setSecondPlacePoints={setSecondPlacePoints}
          thirdPlacePoints={thirdPlacePoints}
          setThirdPlacePoints={setThirdPlacePoints}
          matchWinnerPoints={matchWinnerPoints}
          setMatchWinnerPoints={setMatchWinnerPoints}
          matchScorePoints={matchScorePoints}
          setMatchScorePoints={setMatchScorePoints}
          groupWinnerPoints={groupWinnerPoints}
          setGroupWinnerPoints={setGroupWinnerPoints}
          stageWinnerPoints={stageWinnerPoints}
          setStageWinnerPoints={setStageWinnerPoints}
          firstPlaceTeamId={firstPlaceTeamId}
          setFirstPlaceTeamId={setFirstPlaceTeamId}
          secondPlaceTeamId={secondPlaceTeamId}
          setSecondPlaceTeamId={setSecondPlaceTeamId}
          thirdPlaceTeamId={thirdPlaceTeamId}
          setThirdPlaceTeamId={setThirdPlaceTeamId}
          disabled={isLoading}
        />
        <div>
          <FieldLabel>{t('createTournament.participants')}</FieldLabel>
          <ul className="space-y-1">
            {tournament.participant_lst.map((p) => {
              const participantIsAdmin = tournament.admin_lst.some((a) => a.id === p.id)
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2"
                >
                  <span className="flex-1 min-w-0 text-sm text-gray-800 dark:text-gray-200 truncate">
                    {p.user_name ?? `User #${p.id}`}
                  </span>
                  {participantIsAdmin && (
                    <span className="flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                      {t('createTournament.adminBadge')}
                    </span>
                  )}
                  {tournament.stake && (
                    <button
                      type="button"
                      onClick={() => handleToggleStakePaid(p.id, p.stake_paid)}
                      title={p.stake_paid ? t('createTournament.markStakeUnpaid') : t('createTournament.markStakePaid')}
                      className={[
                        'flex-shrink-0 p-1 rounded transition',
                        p.stake_paid
                          ? 'text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-200'
                          : 'text-gray-400 hover:text-green-500 dark:hover:text-green-400',
                      ].join(' ')}
                    >
                      <CircleDollarSign size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleToggleAdmin(p.id, participantIsAdmin)}
                    title={participantIsAdmin ? t('createTournament.demoteAdmin') : t('createTournament.promoteAdmin')}
                    className={[
                      'flex-shrink-0 p-1 rounded transition',
                      participantIsAdmin
                        ? 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300'
                        : 'text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400',
                    ].join(' ')}
                  >
                    <Crown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveParticipant(p.id, participantIsAdmin)}
                    title={t('createTournament.removeCompetition')}
                    className="flex-shrink-0 p-1 rounded text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                  >
                    <UserX size={14} />
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">{t('createTournament.noteParticipants')}</p>
          <ErrorMsg msg={memberError} />
        </div>
        <div className="flex flex-wrap gap-2">
          {tournament.stake && (() => {
            const mins = minsLeft('send-payment-reminder')
            return (
              <button
                type="button"
                onClick={() => handleAdminAction('send-payment-reminder')}
                disabled={isLoading || isActionLoading || mins !== null}
                title={mins !== null ? t('createTournament.paymentReminderCooldown', { mins }) : undefined}
                className="inline-flex items-center gap-1 rounded-full border border-gray-300 dark:border-gray-600 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition"
              >
                {currentAction === 'send-payment-reminder'
                  ? <Loader2 size={12} className="animate-spin" />
                  : <BellRing size={12} />}
                {currentAction === 'send-payment-reminder'
                  ? t('createTournament.sendingPaymentReminders')
                  : mins !== null
                    ? t('createTournament.paymentReminderCooldown', { mins })
                    : t('createTournament.sendPaymentReminders')}
              </button>
            )
          })()}
          {tournament.football_data_org_id && (() => {
            const mins = minsLeft('update-tournament')
            return (
              <button
                type="button"
                onClick={() => handleAdminAction('update-tournament')}
                disabled={isLoading || isActionLoading || mins !== null}
                title={mins !== null ? t('createTournament.apiUpdateCooldown', { mins }) : undefined}
                className="inline-flex items-center gap-1 rounded-full border border-gray-300 dark:border-gray-600 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition"
              >
                {currentAction === 'update-tournament'
                  ? <Loader2 size={12} className="animate-spin" />
                  : <RefreshCw size={12} />}
                {currentAction === 'update-tournament'
                  ? t('createTournament.apiUpdating')
                  : mins !== null
                    ? t('createTournament.apiUpdateCooldown', { mins })
                    : t('createTournament.apiUpdate')}
              </button>
            )
          })()}
        </div>
        <ErrorMsg msg={error} />
      </ModalBody>
      <ModalFooter justify="between">
        <BtnDanger onClick={handleDelete} disabled={isLoading || isActionLoading} loading={isDeleting}>
          {isDeleting ? t('common.deleting') : t('common.delete')}
        </BtnDanger>
        <div className="flex gap-2">
          <BtnSecondary onClick={onClose}>{t('common.cancel')}</BtnSecondary>
          <BtnPrimary onClick={handleSave} disabled={isLoading || isActionLoading} loading={isSaving}>
            {isSaving ? t('common.saving') : t('common.save')}
          </BtnPrimary>
        </div>
      </ModalFooter>
    </ModalShell>
  )
}
