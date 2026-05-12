import {
	call,
	all,
	takeLatest,
	put,
	fork,
} from "redux-saga/effects";

import { ActionWithPayLoad } from "../store-utils";


import { AUTH_ACTION_TYPES } from "./types";
import {
	logoutFailure,
	logoutSuccess,
	setAccessToken,
	setRefreshToken,
	setCurrentUser,
	setInactivityTimeout,
	userActivityDetected,
	setTemporaryPermissions,
	setSchool,
	loginFailure,

} from "./actions";

import { LoginResponse as IAuthResponse } from "@/types";
import { UserLogin, VerifyEmail, ResendOTP } from "@/features/auth/auth.service";
import { ILoginInput } from "@/features/auth/auth.schemas";


// const DEFAULT_PRIMARY_COLOR = "#000000"; 
// const DEFAULT_RING_COLOR = "#000000";
// const DEFAULT_SIDEBAR_ACCENT_COLOR = "#000000";

const sendBroadcastMessage = (msg: any) => { };



function* login({
	payload,
}: ActionWithPayLoad<AUTH_ACTION_TYPES.LOGIN_START, ILoginInput>) {
	try {
		const result: { success: boolean; data?: any; error?: any } = yield call(UserLogin as any, { data: payload });

		if (!result.success) {
			yield put(loginFailure(result.error.message || result.error));
			return;
		}

		const authResponse = result.data as IAuthResponse;

		// Set tokens immediately (needed for subsequent API calls)
		yield put(setAccessToken(authResponse.access));
		yield put(setRefreshToken(authResponse.refresh));

		// // Use access token to calculate lifetime if helper exists
		// let lifetime = 3600; // Default 1 hour
		// try {
		// 	lifetime = parseJwtLifetime(authResponse.access);
		// } catch (e) {
		// 	console.warn("Failed to parse JWT lifetime", e);
		// }

		// yield put(setInactivityTimeout(lifetime));

		yield put(setCurrentUser(authResponse.user_profile));

		if (authResponse.school) {
			yield put(setSchool(authResponse.school));
		}

		if (authResponse.user_profile.user_permissions) {
			// Convert permissions to IPermission if necessary, assuming it matches
			yield put(setTemporaryPermissions(authResponse.user_profile.user_permissions as any));
		}

		yield put(userActivityDetected());

		if (typeof window !== "undefined") {
			sendBroadcastMessage({ type: "LOGIN_SUCCESS" });
		}
	} catch (error: any) {
		yield put(loginFailure(error.message));
	}
}

function* logout() {
	try {
		yield put(logoutSuccess());

		if (typeof window !== "undefined") {
			sendBroadcastMessage({ type: "LOGOUT_SUCCESS" });
		}


	} catch (error) {
		yield put(logoutFailure("Something went wrong, could not logout !"));
	}
}





export function* watchLogin() {
	yield takeLatest(AUTH_ACTION_TYPES.LOGIN_START, login);
}

export function* watchLogout() {
	yield takeLatest(AUTH_ACTION_TYPES.LOGOUT_START, logout);
}

export function* authSaga() {
	yield all([
		fork(watchLogin),
		fork(watchLogout),
	]);
}
