import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import driverSlice from './slices/driverSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    driver: driverSlice
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
