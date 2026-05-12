import { fork } from "redux-saga/effects";
import { authSaga } from "@/store/auth/sagas";


function* rootSaga() {
	yield fork(authSaga);
}

export default rootSaga;
