import datetime
import random

from sqlalchemy import text

from src.database import AsyncSessionLocal, _IS_SQLITE
from src.users import crud as user_crud
from src.users.models import UserCreate
from src.logging_config import get_logger
from src.matches import crud as match_crud
from src.matches.models import MatchCreate, MatchUpdate
from src.tournaments import crud as tournament_crud
from src.tournaments.models import TournamentCreate
from src.teams import crud as team_crud
from src.teams.models import TeamCreate
from src.groups_stages import crud as gs_crud
from src.groups_stages.models import GroupCreate, StageCreate
from src.predictions import crud as prediction_crud
from src.predictions.models import (
    PredictTournamentCreate,
    PredictGroupCreate,
    PredictStageCreate,
    PredictMatchCreate,
)

logger = get_logger(__name__)

_LOAD_TEST_DATA_LOCK_KEY = 20260510

# (name, iso_code, flag_url, group_letter)
_TEAM_DATA = [
    ("Brazil",      "BRA", "https://flagcdn.com/br.svg", "A"),
    ("Germany",     "GER", "https://flagcdn.com/de.svg", "A"),
    ("Japan",       "JPN", "https://flagcdn.com/jp.svg", "A"),
    ("Australia",   "AUS", "https://flagcdn.com/au.svg", "A"),
    ("France",      "FRA", "https://flagcdn.com/fr.svg", "B"),
    ("Argentina",   "ARG", "https://flagcdn.com/ar.svg", "B"),
    ("Morocco",     "MAR", "https://flagcdn.com/ma.svg", "B"),
    ("Senegal",     "SEN", "https://flagcdn.com/sn.svg", "B"),
    ("England",     "ENG", "https://flagcdn.com/gb-eng.svg", "C"),
    ("Spain",       "ESP", "https://flagcdn.com/es.svg", "C"),
    ("USA",         "USA", "https://flagcdn.com/us.svg", "C"),
    ("Mexico",      "MEX", "https://flagcdn.com/mx.svg", "C"),
    ("Portugal",    "POR", "https://flagcdn.com/pt.svg", "D"),
    ("Netherlands", "NED", "https://flagcdn.com/nl.svg", "D"),
    ("Uruguay",     "URU", "https://flagcdn.com/uy.svg", "D"),
    ("Colombia",    "COL", "https://flagcdn.com/co.svg", "D"),
]

# Group stage fixtures: (home, away, days_offset, home_goals, away_goals)
_GROUP_FIXTURES = [
    # Group A
    ("Brazil",    "Germany",    -14, 2, 0),
    ("Japan",     "Australia",  -14, 1, 1),
    ("Brazil",    "Japan",      -11, 3, 0),
    ("Germany",   "Australia",  -11, 1, 2),
    ("Brazil",    "Australia",   -7, 2, 1),
    ("Germany",   "Japan",       -7, 1, 1),
    # Group B
    ("France",    "Morocco",    -13, 2, 1),
    ("Argentina", "Senegal",    -13, 1, 0),
    ("France",    "Senegal",    -10, 3, 1),
    ("Argentina", "Morocco",    -10, 2, 0),
    ("France",    "Argentina",   -6, 1, 1),
    ("Morocco",   "Senegal",     -6, 0, 1),
    # Group C
    ("England",   "USA",        -12, 1, 0),
    ("Spain",     "Mexico",     -12, 3, 0),
    ("England",   "Mexico",      -9, 2, 0),
    ("Spain",     "USA",         -9, 1, 0),
    ("England",   "Spain",       -5, 1, 2),
    ("USA",       "Mexico",      -5, 2, 1),
    # Group D
    ("Portugal",     "Uruguay",     -11, 2, 1),
    ("Netherlands",  "Colombia",    -11, 1, 1),
    ("Portugal",     "Colombia",     -8, 0, 0),
    ("Netherlands",  "Uruguay",      -8, 2, 0),
    ("Portugal",     "Netherlands",  -4, 1, 2),
    ("Uruguay",      "Colombia",     -4, 3, 2),
]


async def load_test_data() -> None:
    async with AsyncSessionLocal() as db:
        if not _IS_SQLITE:
            await db.execute(text(f"SELECT pg_advisory_lock({_LOAD_TEST_DATA_LOCK_KEY})"))
        try:
            if await user_crud.get_user_by_email(db, "test@example.com") is not None:
                logger.info("Test data already loaded, skipping.")
                return

            now = datetime.datetime.now(tz=datetime.timezone.utc)

            def days(n: int) -> datetime.datetime:
                return now + datetime.timedelta(days=n)

            # ── Users ─────────────────────────────────────────────────────────
            admin = await user_crud.create_user(db, UserCreate(
                email="test@example.com", password="Password",
                first_name="Admin", last_name="User", gender=None,
            ))
            alice = await user_crud.create_user(db, UserCreate(
                email="test2@example.com", password="Password",
                first_name="Alice", last_name="Smith", gender=None,
            ))
            bob = await user_crud.create_user(db, UserCreate(
                email="test3@example.com", password="Password",
                first_name="Bob", last_name="Jones", gender=None,
            ))
            logger.info("Users created: admin, alice, bob")

            # ── Tournament ────────────────────────────────────────────────────
            tournament = await tournament_crud.create_tournament(
                db,
                TournamentCreate(
                    name="Bolão da Copa 2026 (Demo)",
                    match_winner_points=3,
                    match_score_points=5,
                    group_winner_points=8,
                    stage_winner_points=0,
                    penalty_winner_points=2,
                ),
                admin.id,
            )
            await tournament_crud.join_tournament(db, tournament.join_code, alice.id)
            await tournament_crud.join_tournament(db, tournament.join_code, bob.id)
            logger.info(f"Tournament created: {tournament.name} (join code: {tournament.join_code})")

            # ── Groups ────────────────────────────────────────────────────────
            groups = {
                ltr: await gs_crud.create_group(db, GroupCreate(
                    name=f"Group {ltr}", tournament_id=tournament.id,
                ))
                for ltr in "ABCD"
            }

            # ── Knockout stages (all is_knockout=True) ────────────────────────
            r16   = await gs_crud.create_stage(db, StageCreate(name="Round of 16",    tournament_id=tournament.id, is_knockout=True))
            qf    = await gs_crud.create_stage(db, StageCreate(name="Quarter-finals", tournament_id=tournament.id, is_knockout=True))
            sf    = await gs_crud.create_stage(db, StageCreate(name="Semi-finals",    tournament_id=tournament.id, is_knockout=True))
            final = await gs_crud.create_stage(db, StageCreate(name="Final",          tournament_id=tournament.id, is_knockout=True))
            knockout_stage_ids = {r16.id, qf.id, sf.id, final.id}
            logger.info("Groups and stages created")

            # ── Teams ─────────────────────────────────────────────────────────
            team = {}
            for name, iso, flag_url, grp in _TEAM_DATA:
                team[name] = await team_crud.create_team(db, TeamCreate(
                    tournament_id=tournament.id,
                    name=name,
                    iso_code=iso,
                    image_url=flag_url,
                    group_id=groups[grp].id,
                ))
            all_teams = list(team.values())
            logger.info(f"Teams created: {len(team)}")

            # ── Group stage matches ───────────────────────────────────────────
            for home, away, d, hg, ag in _GROUP_FIXTURES:
                await match_crud.create_match(db, MatchCreate(
                    tournament_id=tournament.id,
                    home_team_id=team[home].id,
                    away_team_id=team[away].id,
                    start_datetime=days(d),
                    home_goals=hg,
                    away_goals=ag,
                ))
            logger.info("Group stage matches created")

            # ── Knockout matches ──────────────────────────────────────────────
            # Past R16 #1 — Brazil 1-1 Argentina → Brazil wins on penalties
            bra_arg = await match_crud.create_match(db, MatchCreate(
                tournament_id=tournament.id,
                stage_id=r16.id,
                home_team_id=team["Brazil"].id,
                away_team_id=team["Argentina"].id,
                start_datetime=days(-3),
                home_goals=1,
                away_goals=1,
            ))

            # Past R16 #2 — France 2-0 Spain (clear winner, no penalties)
            fra_spa = await match_crud.create_match(db, MatchCreate(
                tournament_id=tournament.id,
                stage_id=r16.id,
                home_team_id=team["France"].id,
                away_team_id=team["Spain"].id,
                start_datetime=days(-2),
                home_goals=2,
                away_goals=0,
            ))

            # Future R16
            await match_crud.create_match(db, MatchCreate(
                tournament_id=tournament.id, stage_id=r16.id,
                home_team_id=team["England"].id, away_team_id=team["Portugal"].id,
                start_datetime=days(2),
            ))
            await match_crud.create_match(db, MatchCreate(
                tournament_id=tournament.id, stage_id=r16.id,
                home_team_id=team["Germany"].id, away_team_id=team["Netherlands"].id,
                start_datetime=days(3),
            ))

            # Future QF, SF, Final
            await match_crud.create_match(db, MatchCreate(tournament_id=tournament.id, stage_id=qf.id,    home_team_id=team["Brazil"].id,  away_team_id=team["France"].id,   start_datetime=days(7)))
            await match_crud.create_match(db, MatchCreate(tournament_id=tournament.id, stage_id=qf.id,    home_team_id=team["England"].id, away_team_id=team["Germany"].id,  start_datetime=days(8)))
            await match_crud.create_match(db, MatchCreate(tournament_id=tournament.id, stage_id=sf.id,    home_team_id=team["Brazil"].id,  away_team_id=team["England"].id,  start_datetime=days(12)))
            await match_crud.create_match(db, MatchCreate(tournament_id=tournament.id, stage_id=sf.id,    home_team_id=team["France"].id,  away_team_id=team["Germany"].id,  start_datetime=days(13)))
            await match_crud.create_match(db, MatchCreate(tournament_id=tournament.id, stage_id=final.id, home_team_id=team["Brazil"].id,  away_team_id=team["France"].id,   start_datetime=days(17)))
            logger.info("Knockout matches created")

            # ── Predictions ───────────────────────────────────────────────────
            all_matches = await match_crud.get_matches_by_tournament(db, tournament.id)

            for u in [admin, alice, bob]:
                await prediction_crud.upsert_predict_tournament(db,
                    PredictTournamentCreate(tournament_id=tournament.id, winner_team_id=random.choice(all_teams).id),
                    user_id=u.id,
                )
                for grp in groups.values():
                    if random.random() > 0.3:
                        await prediction_crud.upsert_predict_group(db,
                            PredictGroupCreate(group_id=grp.id, winner_team_id=random.choice(all_teams).id),
                            user_id=u.id,
                        )
                for stage_obj in [r16, qf, sf, final]:
                    if random.random() > 0.4:
                        await prediction_crud.upsert_predict_stage(db,
                            PredictStageCreate(stage_id=stage_obj.id, winner_team_id=random.choice(all_teams).id),
                            user_id=u.id,
                        )

                for match in all_matches:
                    if not match.home_team_id or not match.away_team_id:
                        continue
                    if random.random() > 0.25:
                        h = random.randint(0, 3)
                        a = random.randint(0, 3)
                        pen = None

                        # Scripted predictions for the Brazil-Argentina draw match
                        if match.id == bra_arg.id:
                            if u == admin:
                                h, a, pen = 1, 1, team["Brazil"].id      # correct draw + correct penalty pick
                            elif u == alice:
                                h, a, pen = 1, 1, team["Argentina"].id   # correct draw, wrong penalty pick
                            else:
                                h, a, pen = 2, 1, None                    # wrong score, no penalty pick needed
                        elif match.stage_id in knockout_stage_ids and h == a:
                            pen = random.choice([match.home_team_id, match.away_team_id])

                        await prediction_crud.upsert_predict_match(db,
                            PredictMatchCreate(
                                match_id=match.id,
                                home_score=h,
                                away_score=a,
                                penalty_winner_team_id=pen,
                            ),
                            user_id=u.id,
                        )

            logger.info("Predictions created")

            # ── Set penalty winner on completed draw match (triggers recalculation) ──
            await match_crud.update_match(db, bra_arg.id, MatchUpdate(penalty_winner_team_id=team["Brazil"].id))
            logger.info("Penalty winner set: Brazil won on penalties vs Argentina → points recalculated")

            logger.info("Test data loaded successfully")
            logger.info("Login: test@example.com / test2@example.com / test3@example.com — password: Password")

        finally:
            if not _IS_SQLITE:
                await db.execute(text(f"SELECT pg_advisory_unlock({_LOAD_TEST_DATA_LOCK_KEY})"))
