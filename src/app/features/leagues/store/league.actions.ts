import { createAction, props } from '@ngrx/store';
import { League, LeagueWithDetails, CreateLeagueData, UpdateLeagueData, LeagueMember } from '../models/league.model';

// Load leagues
export const loadMyLeagues = createAction('[League] Load My Leagues');
export const loadMyLeaguesSuccess = createAction('[League] Load My Leagues Success', props<{ leagues: League[] }>());
export const loadMyLeaguesFailure = createAction('[League] Load My Leagues Failure', props<{ error: string }>());

// Load single league
export const loadLeague = createAction('[League] Load League', props<{ id: string }>());
export const loadLeagueSuccess = createAction('[League] Load League Success', props<{ league: LeagueWithDetails }>());
export const loadLeagueFailure = createAction('[League] Load League Failure', props<{ error: string }>());

// Create league
export const createLeague = createAction('[League] Create League', props<{ data: CreateLeagueData }>());
export const createLeagueSuccess = createAction('[League] Create League Success', props<{ league: League }>());
export const createLeagueFailure = createAction('[League] Create League Failure', props<{ error: string }>());

// Update league
export const updateLeague = createAction('[League] Update League', props<{ id: string; data: UpdateLeagueData }>());
export const updateLeagueSuccess = createAction('[League] Update League Success', props<{ league: League }>());
export const updateLeagueFailure = createAction('[League] Update League Failure', props<{ error: string }>());

// Delete league
export const deleteLeague = createAction('[League] Delete League', props<{ id: string }>());
export const deleteLeagueSuccess = createAction('[League] Delete League Success', props<{ id: string }>());
export const deleteLeagueFailure = createAction('[League] Delete League Failure', props<{ error: string }>());

// Join league
export const joinLeague = createAction('[League] Join League', props<{ code: string }>());
export const joinLeagueSuccess = createAction('[League] Join League Success', props<{ league: League }>());
export const joinLeagueFailure = createAction('[League] Join League Failure', props<{ error: string }>());

// Leave league
export const leaveLeague = createAction('[League] Leave League', props<{ id: string }>());
export const leaveLeagueSuccess = createAction('[League] Leave League Success', props<{ id: string }>());
export const leaveLeagueFailure = createAction('[League] Leave League Failure', props<{ error: string }>());

// Load members
export const loadLeagueMembers = createAction('[League] Load Members', props<{ leagueId: string }>());
export const loadLeagueMembersSuccess = createAction('[League] Load Members Success', props<{ leagueId: string; members: LeagueMember[] }>());
export const loadLeagueMembersFailure = createAction('[League] Load Members Failure', props<{ error: string }>());
