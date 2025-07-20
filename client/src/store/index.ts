import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import expenseReducer from './slices/expenseSlice';
import expenseCategoryReducer from './slices/expenseCategorySlice';
import departmentReducer from './slices/departmentSlice';
import vendorReducer from './slices/vendorSlice';
import termReducer from './slices/termSlice';
import academicYearReducer from './slices/academicYearSlice';
import memberStudentReducer from './slices/memberStudentSlice';
import memberTeacherReducer from './slices/memberTeacherSlice';
import memberParentReducer from './slices/memberParentSlice';
import memberNonStaffReducer from './slices/memberNonStaffSlice';
import memberClassReducer from './slices/memberClassSlice';
import memberStreamReducer from './slices/memberStreamSlice';
import roleReducer from './slices/roleSlice';

// Configure the store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    expenses: expenseReducer,
    expenseCategories: expenseCategoryReducer,
    departments: departmentReducer,
    vendors: vendorReducer,
    terms: termReducer,
    academicYears: academicYearReducer,
    // Members management
    memberStudents: memberStudentReducer,
    memberTeachers: memberTeacherReducer,
    memberParents: memberParentReducer,
    memberNonStaff: memberNonStaffReducer,
    memberClasses: memberClassReducer,
    memberStreams: memberStreamReducer,
    role: roleReducer,
    // Add other slices here as we create them
    // students: studentsReducer,
    // fees: feesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store; 