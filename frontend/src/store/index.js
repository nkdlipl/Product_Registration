import { configureStore } from '@reduxjs/toolkit';
import draftReducer from './slices/draftSlice';

export const store = configureStore({
  reducer: {
    drafts: draftReducer,
  },
});
