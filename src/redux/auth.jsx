import {createSlice} from '@reduxjs/toolkit';
import {User, UserManager} from 'oidc-client-ts';

const initialState = {
  user: {},
};

export const counterSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state) => {
      state.user = {};
    },
  },
});

// Action creators are generated for each case reducer function
export const {setUser} = counterSlice.actions;

export default counterSlice.reducer;
