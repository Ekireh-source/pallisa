import { createSelector } from "reselect";

import { RootState } from "../root-reducer";

const authSlice = (state: RootState) => state.auth;

export const selectAuthResponse = createSelector([authSlice], (slice) => slice);

export const selectUser = createSelector([selectAuthResponse], (response) => response.user.value);

export const selectAuthTokens = createSelector([selectAuthResponse], (response) => ({
	access_token: response.accessToken,
	refresh_token: response.refreshToken,
}));

export const selectAuthError = createSelector([authSlice], (slice) => slice.user.error);

export const selectUserLoading = createSelector([authSlice], (slice) => slice.user.loading);

export const selectAccessToken = createSelector([authSlice], (slice) => slice.accessToken);

export const selectRefreshToken = createSelector([authSlice], (slice) => slice.refreshToken);







export const selectInactivityTimeout = createSelector(
	[authSlice],
	(slice) => slice.inactivityTimeout,
);
export const selectLogoutWarningVisible = createSelector(
	[authSlice],
	(slice) => slice.logoutWarningVisible,
);
export const selectRefreshInProgress = createSelector(
	[authSlice],
	(slice) => slice.refreshInProgress,
);

export const selectLastRefreshTimeInMilliseconds = createSelector(
	[authSlice],
	(slice) => slice.lastRefreshTimeMilliseconds,
);

export const selectSchool = createSelector([authSlice], (slice) => slice.school);


