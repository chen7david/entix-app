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
