import { ActionWithPayLoad, Action, createAction } from "../store-utils";

import { AUTH_ACTION_TYPES } from "./types";
import { AuthError } from "./reducer";

import { Permission as IPermission, User as IUser, School as ISchool } from "@/types";
import { ILoginInput } from "@/features/auth/auth.schemas";



type LoginStart = ActionWithPayLoad<
	AUTH_ACTION_TYPES.LOGIN_START,
	ILoginInput
>;

type LoginFailure = ActionWithPayLoad<AUTH_ACTION_TYPES.LOGIN_FAILURE, AuthError>;

type SetUser = ActionWithPayLoad<AUTH_ACTION_TYPES.SET_USER, IUser>;
type SetSchool = ActionWithPayLoad<AUTH_ACTION_TYPES.SET_SCHOOL, ISchool | null>;

type SetTemporaryPermissions = ActionWithPayLoad<
	AUTH_ACTION_TYPES.SET_TEMPORARY_PERMISSIONS,
	IPermission[]
>;
type ClearTemporaryPermissions = Action<AUTH_ACTION_TYPES.CLEAR_TEMPORARY_PERMISSIONS>;

type LogoutStart = Action<AUTH_ACTION_TYPES.LOGOUT_START>;

type LogoutFailure = ActionWithPayLoad<AUTH_ACTION_TYPES.LOGOUT_FAILURE, string>;

type LogoutSuccess = Action<AUTH_ACTION_TYPES.LOGOUT_SUCCESS>;

type SetRefreshToken = ActionWithPayLoad<AUTH_ACTION_TYPES.SET_REFRESH_TOKEN, string>;

type SetAccessToken = ActionWithPayLoad<AUTH_ACTION_TYPES.SET_ACCESS_TOKEN, string>;

type ClearAuthError = Action<AUTH_ACTION_TYPES.CLEAR_AUTH_ERROR>;
type ClearAuthLoading = Action<AUTH_ACTION_TYPES.CLEAR_AUTH_LOADING>;



export type AuthAction =
	| LoginStart
	| LoginFailure
	| SetUser
	| SetSelectedAccountIds
	| LogoutStart
	| LogoutFailure
	| LogoutSuccess
	| SetRefreshToken
	| SetAccessToken
	| ClearAuthError
	| ClearAuthLoading
	| Action<AUTH_ACTION_TYPES.USER_ACTIVITY_DETECTED>
	| Action<AUTH_ACTION_TYPES.REMOTE_USER_ACTIVITY_DETECTED>
	| Action<AUTH_ACTION_TYPES.SHOW_LOGOUT_WARNING>
	| Action<AUTH_ACTION_TYPES.HIDE_LOGOUT_WARNING>
	| Action<AUTH_ACTION_TYPES.CONFIRM_LOGOUT>
	| Action<AUTH_ACTION_TYPES.CANCEL_LOGOUT>
	| Action<AUTH_ACTION_TYPES.REFRESH_TOKENS_START>
	| Action<AUTH_ACTION_TYPES.REFRESH_TOKENS_SUCCESS>
	| Action<AUTH_ACTION_TYPES.REFRESH_TOKENS_FAILURE>
	| ActionWithPayLoad<AUTH_ACTION_TYPES.SET_INACTIVITY_TIMEOUT, number>
	| SetSchool

export const getAuthError = (error: unknown): AuthError => {
	if (typeof error === "string") {
		return { customCode: "AUTH_ERROR", message: error };
	}
	const err = error as any;
	return {
		customCode: err?.customCode || "AUTH_ERROR",
		message: err?.message || "An unexpected error occurred",
	};
};

export const loginStart = (data: ILoginInput): LoginStart =>
	createAction(AUTH_ACTION_TYPES.LOGIN_START, data);

export const loginFailure = (error: unknown): LoginFailure =>
	createAction(AUTH_ACTION_TYPES.LOGIN_FAILURE, getAuthError(error));

export const logoutStart = (): LogoutStart => createAction(AUTH_ACTION_TYPES.LOGOUT_START);
export const logoutFailure = (errorMessage: string): LogoutFailure =>
	createAction(AUTH_ACTION_TYPES.LOGOUT_FAILURE, errorMessage);
export const logoutSuccess = (): LogoutSuccess => createAction(AUTH_ACTION_TYPES.LOGOUT_SUCCESS);

export const setCurrentUser = (user: IUser): SetUser =>
	createAction(AUTH_ACTION_TYPES.SET_USER, user);


type SetSelectedAccountIds = ActionWithPayLoad<AUTH_ACTION_TYPES.SET_SELECTED_ACCOUNT_IDS, string[]>;
export const setSelectedAccountIds = (accountIds: string[]): SetSelectedAccountIds =>
	createAction(AUTH_ACTION_TYPES.SET_SELECTED_ACCOUNT_IDS, accountIds);


export const setRefreshToken = (token: string): SetRefreshToken =>
	createAction(AUTH_ACTION_TYPES.SET_REFRESH_TOKEN, token);
export const setAccessToken = (token: string): SetAccessToken =>
	createAction(AUTH_ACTION_TYPES.SET_ACCESS_TOKEN, token);

export const clearAuthError = (): ClearAuthError =>
	createAction(AUTH_ACTION_TYPES.CLEAR_AUTH_ERROR);

export const clearAuthLoading = (): ClearAuthLoading =>
	createAction(AUTH_ACTION_TYPES.CLEAR_AUTH_LOADING);
export const setTemporaryPermissions = (
	temporaryPermissions: IPermission[],
): SetTemporaryPermissions =>
	createAction(AUTH_ACTION_TYPES.SET_TEMPORARY_PERMISSIONS, temporaryPermissions);

export const userActivityDetected = () => createAction(AUTH_ACTION_TYPES.USER_ACTIVITY_DETECTED);
export const remoteUserActivityDetected = () =>
	createAction(AUTH_ACTION_TYPES.REMOTE_USER_ACTIVITY_DETECTED);
export const showLogoutWarning = () => createAction(AUTH_ACTION_TYPES.SHOW_LOGOUT_WARNING);
export const hideLogoutWarning = () => createAction(AUTH_ACTION_TYPES.HIDE_LOGOUT_WARNING);
export const confirmLogout = () => createAction(AUTH_ACTION_TYPES.CONFIRM_LOGOUT);
export const cancelLogout = () => createAction(AUTH_ACTION_TYPES.CANCEL_LOGOUT);
export const refreshAccessTokenStart = () => createAction(AUTH_ACTION_TYPES.REFRESH_TOKENS_START);
export const refreshAccessTokenSuccess = () =>
	createAction(AUTH_ACTION_TYPES.REFRESH_TOKENS_SUCCESS);
export const refreshAccessTokenFailure = () =>
	createAction(AUTH_ACTION_TYPES.REFRESH_TOKENS_FAILURE);

export const setInactivityTimeout = (timeout: number) =>
	createAction(AUTH_ACTION_TYPES.SET_INACTIVITY_TIMEOUT, timeout);

export const setSchool = (school: ISchool | null): SetSchool =>
	createAction(AUTH_ACTION_TYPES.SET_SCHOOL, school);
