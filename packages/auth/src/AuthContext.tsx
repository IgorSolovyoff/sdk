// @flow

import React from 'react';
import { AuthState, AuthClient, Authorizable } from '@8base/utils';

export type AuthContextProps = AuthClient & (Authorizable | {}) & {
  isAuthorized: boolean,
  authState: AuthState,
};

const AuthContext = React.createContext({
  isAuthorized: false,
  authState: {},
});

export { AuthContext };
