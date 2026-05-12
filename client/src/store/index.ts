import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware, { Task } from "redux-saga";
import { Store } from "@reduxjs/toolkit";
import {
	persistStore,
	persistReducer,
	PersistConfig,
	FLUSH,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER,
	REHYDRATE,
} from "redux-persist";
import { createWrapper, MakeStore, Context } from "next-redux-wrapper";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";


import { clearStateIfStructureChanged } from "./store-utils";
import rootReducer, { RootState } from "./root-reducer";
export type { RootState };
import rootSaga from "./root-saga";

const createNoopStorage = () => {
	return {
		getItem(_key: any) {
			return Promise.resolve(null);
		},
		setItem(_key: any, value: any) {
			return Promise.resolve(value);
		},
		removeItem(_key: any) {
			return Promise.resolve();
		},
	};
};

const storage = typeof window !== "undefined" ? createWebStorage("local") : createNoopStorage();

const persistConfig: PersistConfig<RootState> = {
	key: "root",
	storage,
	version: 2.1,
	blacklist: [], // We can define the slices to blacklist here,
	migrate: async (state, currentVersion) => {
		if (!state || state._persist.version !== currentVersion) {
			return undefined;
		}

		return state;
	},
};

const persistedReducer = persistReducer(
	persistConfig as unknown as PersistConfig<RootState>,
	rootReducer as any,
);

// Extend Redux Store to include sagaTask for
export interface AppStore extends Store<RootState> {
	sagaTask?: Task<any>;
}

// Define typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Define type for dispatch
export type AppDispatch = ReturnType<typeof configureAppStore>["dispatch"];

// Configure the store
export const configureAppStore = () => {
	// Create the saga middleware
	const sagaMiddleware = createSagaMiddleware();

	clearStateIfStructureChanged();

	const store = configureStore({
		reducer: persistedReducer,
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware({
				thunk: false,
				serializableCheck: {
					ignoredActions: [
						FLUSH,
						PAUSE,
						PERSIST,
						PURGE,
						REGISTER,
						REHYDRATE, // !Important: We'll be ignoring these actions cause they are internal to redux and are not created or managed by us, plus they are not serializable which might create conflicts in our root reducer
					],
				},
			}).concat(sagaMiddleware as any),
	});

	// Run the root saga
	(store as any).sagaTask = sagaMiddleware.run(rootSaga);

	// store.subscribe(() => {
	// 	const state = store.getState();
	// 	console.log("\n\n Current auth: ", state.auth);
	// });

	return store;
};

// MakeStore function for next-redux-wrapper
const makeStore: MakeStore<ReturnType<typeof configureAppStore>> = (_: Context) =>
	configureAppStore();

// Export the Next.js wrapper
export const wrapper = createWrapper<ReturnType<typeof configureAppStore>>(makeStore, {
	debug: process.env.NODE_ENV === "development",
});

export const store = configureAppStore();
export const persistor = persistStore(store);
