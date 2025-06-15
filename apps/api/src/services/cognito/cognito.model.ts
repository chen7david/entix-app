export type CognitoSingUpParams = {
  username: string;
  email: string;
  password: string;
};

export type CognitoSingUpDelivery = {
  deliveryMedium: string;
  method: string;
  destination: string;
};

export type CognitoResendConfirmationCodeParams = {
  username: string;
};

export type CognitoConfirmSignUpParams = {
  username: string;
  confirmationCode: string;
};

export type CognitoConfirmSignUpResult = {
  success: boolean;
};

export type CognitoResendConfirmationCodeResult = CognitoSingUpDelivery;

export type CognitoSingUpResult = {
  userSub: string;
  isConfirmed: boolean;
  delivery: CognitoSingUpDelivery;
};

export type CognitoLoginParams = {
  username: string;
  password: string;
};

export type CognitoLoginResult = {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  refreshToken: string;
  idToken: string;
};

export type CognitoForgotPasswordParams = {
  username: string;
};

export type CognitoForgotPasswordResult = {
  deliveryMedium: string;
  method: string;
  destination: string;
};

export type CognitoConfirmForgotPasswordParams = {
  username: string;
  confirmationCode: string;
  password: string;
};

export type CognitoConfirmForgotPasswordResult = {
  success: boolean;
};

export type CognitoChangePasswordParams = {
  cognitoAccessToken: string;
  previousPassword: string;
  proposedPassword: string;
};

export type CognitoChangePasswordResult = {
  success: boolean;
};

export type CognitoLogoutParams = {
  cognitoAccessToken: string;
};

export type CognitoLogoutResult = {
  success: boolean;
};

export type CognitoRefreshTokenParams = {
  cognitoRefreshToken: string;
};

export type CognitoRefreshTokenResult = {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  refreshToken: string;
  idToken: string;
};
