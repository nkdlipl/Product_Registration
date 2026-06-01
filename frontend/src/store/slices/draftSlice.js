import { createSlice } from '@reduxjs/toolkit';

const initialState = {};

export const draftSlice = createSlice({
  name: 'drafts',
  initialState,
  reducers: {
    saveDraft: (state, action) => {
      const { formId, data, tab } = action.payload;
      state[formId] = {
        data: { ...state[formId]?.data, ...data },
        tab: tab || state[formId]?.tab || 'general',
        lastUpdated: new Date().toISOString()
      };
    },
    clearDraft: (state, action) => {
      const { formId } = action.payload;
      delete state[formId];
    }
  }
});

export const { saveDraft, clearDraft } = draftSlice.actions;
export default draftSlice.reducer;
