import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserRole } from '@/types';

interface UserState {
  user: Record<string, any> | null;
  isAuthenticated: boolean;
  role: UserRole | null;
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  role: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Record<string, any>>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      if (action.payload.role) {
        state.role = action.payload.role;
      }
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.role = null;
    },
    updateUser: (state, action: PayloadAction<Record<string, any>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setUser, clearUser, updateUser } = userSlice.actions;
export default userSlice.reducer;
