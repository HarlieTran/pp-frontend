import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);

export function getCognitoUser(email: string) {
  return new CognitoUser({
    Username: email,
    Pool: userPool,
  });
}

export function getCurrentUser() {
  return userPool.getCurrentUser();
}

export async function getSession(): Promise<CognitoUserSession | null> {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;

  return new Promise((resolve, reject) => {
    currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err) {
        reject(err);
      } else {
        resolve(session);
      }
    });
  });
}

export async function getAuthToken(): Promise<string | null> {
  try {
    const session = await getSession();
    if (session && session.isValid()) {
      return session.getIdToken().getJwtToken();
    }
    return null;
  } catch (error) {
    console.error("Error getting auth token", error);
    return null;
  }
}

export function signUp(email: string, password: string, name: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const attributeList = [
      new CognitoUserAttribute({ Name: "email", Value: email }),
      new CognitoUserAttribute({ Name: "name", Value: name }),
    ];
    userPool.signUp(email, password, attributeList, null as any, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

export function confirmRegistration(email: string, code: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const cognitoUser = getCognitoUser(email);
    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

export function login(email: string, password: string): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });
    const cognitoUser = getCognitoUser(email);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => resolve(result),
      onFailure: (err) => reject(err),
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        // Optional: handle forced password reset
        reject(new Error("New password required."));
      },
    });
  });
}

export function logout() {
  const currentUser = getCurrentUser();
  if (currentUser) {
    currentUser.signOut();
  }
}
