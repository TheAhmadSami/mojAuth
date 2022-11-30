import {UserManagerSettings, WebStorageStateStore} from 'oidc-client-ts';

export const authTsConfig: UserManagerSettings = {
  userStore: new WebStorageStateStore(),
  checkSessionIntervalInSeconds: 1000,
  authority: 'https://dev-sso-aqari-tst.red.sa/',
  client_id: 'SREM.FrontEnd.Dev',
  redirect_uri: 'http://localhost:3000/callback.html',
  response_type: 'code',
  scope: 'openid profile iam.profile epm.business.api ept.business.api di.business.api shared.attorney',
  post_logout_redirect_uri: 'http://localhost:3000/callback.html',
  silent_redirect_uri: 'http://localhost:3000/silent-refresh.html',
  automaticSilentRenew: false,
  filterProtocolClaims: true,
  loadUserInfo: true,
  accessTokenExpiringNotificationTimeInSeconds: 660,
  silentRequestTimeoutInSeconds: 60000,
  revokeTokenTypes: ['refresh_token', 'access_token'],
  revokeTokensOnSignout: true,
};
