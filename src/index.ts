import * as oauth  from '@panva/oauth4webapi';

export type CodePair = {
  codeVerifier: string;
  codeChallenge: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface TrimbleIdentityConfig {
  applicationName: string;
  clientId: string;
  redirectUrl: string;
  logoutRedirectUrl: string;
}

// const trimbleConfig: TrimbleIdentityConfig = {
//   applicationName: "da-test",
//   clientId: "df0e507b-0fb6-465e-8cb6-f53bf4a16a20",
//   redirectUrl: "http://localhost:4200/oauth-callback",
//   logoutRedirectUrl: "http://localhost:4200",
// }

const production = null;

const BASE_URL_STAGING = "https://stage.id.trimblecloud.com";
const BASE_URL_PRODUCTION = "https://id.trimble.com";

//Trimble Identity Endpoints
const authorizeUrl = production ? BASE_URL_PRODUCTION : BASE_URL_STAGING + "/oauth/authorize";
const tokenUrl = production ? BASE_URL_PRODUCTION : BASE_URL_STAGING + "/oauth/token";
const logoutUrl = production ? BASE_URL_PRODUCTION : BASE_URL_STAGING + "/oauth/logout";

const myProfileUrl = "https://myprofile.trimble.com/home";

export const createPKCECodes = async (): Promise<CodePair> => {
  const codeVerifier = oauth.generateRandomCodeVerifier();
  const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge }
}

export const generateRandomState = () => {
  return oauth.generateRandomState();
}

export const authorizationCodeWithPkce = async (
  clientId: string,
  applicationName: string,
  redirectUrl: string,
  codeChallenge: string, 
  state?: string
  ) => {

  const authenticationUrl = new URL(authorizeUrl);
  authenticationUrl.searchParams.append("client_id", clientId);
  authenticationUrl.searchParams.append("response_type", "code");
  authenticationUrl.searchParams.append("scope", "openid " + applicationName);
  authenticationUrl.searchParams.append("redirect_uri", redirectUrl);
  authenticationUrl.searchParams.append("code_challenge", codeChallenge);
  authenticationUrl.searchParams.append("code_challenge_method", "S256");
  if (state) {
    authenticationUrl.searchParams.append("state", state);
  }

  window.location.href = authenticationUrl.toString();
}

export const tokenRequest = async (
  clientId: string,
  redirectUrl: string,
  code: string, 
  verifier: string
  ): Promise<TokenResponse> => {

  const params = new URLSearchParams();
  params.set("grant_type", "authorization_code");
  params.set("code", code);
  params.set("tenantDomain", "Trimble.com");
  params.set("redirect_uri", redirectUrl);
  params.set("client_id", clientId);
  params.set("code_verifier", verifier);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    body: params
  })  
  return await response.json();
}

export const tidLogout = async (
  logoutRedirectUrl: string,
  idTokenHint: string, 
  state?: string
  ) => {

  const logout = new URL(logoutUrl);
  logout.searchParams.append("id_token_hint", idTokenHint);
  logout.searchParams.append("post_logout_redirect_uri", logoutRedirectUrl);
  if (state) {
    logout.searchParams.append("state ", state);
  }
  window.location.href = logout.toString();
}
