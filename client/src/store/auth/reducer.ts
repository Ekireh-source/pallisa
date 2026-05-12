import { ActionWithPayLoad, Action } from "../store-utils";
import { AuthAction } from "./actions";
import { AUTH_ACTION_TYPES } from "./types";
import { LoginResponse as IAuthResponse, Permission as IPermission, User as IUser, School as ISchool } from "@/types";



export type AuthError = {
	customCode: string;
	message: string;
};

export type AuthState = {
	refreshToken: string;
	accessToken: string;
	user: {
		loading: boolean;
		value: IUser | null;
		error: AuthError | null;
	};
	temporaryPermissions: IPermission[];
	inactivityTimeout: number;
	logoutWarningVisible: boolean;
	refreshInProgress: boolean;
	lastRefreshTimeMilliseconds: number | null;
	selectedAccountIds: string[];
	school: ISchool | null;
};

const intialAuthState: AuthState = {
	refreshToken: "",
	accessToken: "",
	user: {
		loading: false,
		value: null,
		error: null,
	},
	inactivityTimeout: 0,
	temporaryPermissions: [],
	logoutWarningVisible: false,
	lastRefreshTimeMilliseconds: null,
	refreshInProgress: false,
	selectedAccountIds: [],
	school: null,
};

export const authReducer = (
	state = intialAuthState,
	action: AuthAction | { type: string; payload?: unknown },
): AuthState => {
	switch (action.type) {
		case AUTH_ACTION_TYPES.LOGIN_START:
			return { ...state, user: { ...state.user, loading: true } };
		case AUTH_ACTION_TYPES.LOGOUT_START:
			return { ...state, user: { ...state.user, loading: false } };

		case AUTH_ACTION_TYPES.LOGIN_FAILURE:
			return {
				...state,
				user: { ...state.user, error: action.payload as AuthError, loading: false },
			};
		case AUTH_ACTION_TYPES.LOGOUT_FAILURE:
			return {
				...state,
				user: {
					...state.user,
					error: { ...state.user.error, message: action.payload as string } as AuthError,
					loading: false,
				},
			};
		case AUTH_ACTION_TYPES.SET_ACCESS_TOKEN:
			const now = Date.now();
			return {
				...state,
				accessToken: action.payload as string,
				lastRefreshTimeMilliseconds: now,
			};

		case AUTH_ACTION_TYPES.SET_REFRESH_TOKEN:
			return { ...state, refreshToken: action.payload as string };

		case AUTH_ACTION_TYPES.SET_USER:
			return {
				...state,
				user: {
					...state.user,
					error: null,
					loading: false,
					value: action.payload as IUser,
				},
			};

		case AUTH_ACTION_TYPES.SET_SELECTED_ACCOUNT_IDS:
			return {
				...state,
				selectedAccountIds: action.payload as string[],
			};
		case AUTH_ACTION_TYPES.SET_SCHOOL:
			return {
				...state,
				school: action.payload as ISchool | null,
			};

		case AUTH_ACTION_TYPES.CLEAR_AUTH_ERROR:
			return { ...state, user: { ...state.user, error: null, loading: false } };
		case AUTH_ACTION_TYPES.CLEAR_AUTH_LOADING:
			return {
				...state,
				user: { ...state.user, loading: false },
			};

		case AUTH_ACTION_TYPES.LOGOUT_SUCCESS:
			return {
				...intialAuthState,
				user: { ...intialAuthState.user, loading: false },
			};

		case AUTH_ACTION_TYPES.SHOW_LOGOUT_WARNING:
			return { ...state, logoutWarningVisible: true };
		case AUTH_ACTION_TYPES.HIDE_LOGOUT_WARNING:
			return { ...state, logoutWarningVisible: false };
		case AUTH_ACTION_TYPES.SET_TEMPORARY_PERMISSIONS:
			return {
				...state,
				temporaryPermissions: action.payload as IPermission[],
			};
		case AUTH_ACTION_TYPES.CLEAR_TEMPORARY_PERMISSIONS:
			return {
				...state,
				temporaryPermissions: [],
			};
		case AUTH_ACTION_TYPES.REFRESH_TOKENS_START:
			return { ...state, refreshInProgress: true };
		case AUTH_ACTION_TYPES.REFRESH_TOKENS_SUCCESS:
		case AUTH_ACTION_TYPES.REFRESH_TOKENS_FAILURE:
			return { ...state, refreshInProgress: false, logoutWarningVisible: false };

		default:
			return state;
	}
};
