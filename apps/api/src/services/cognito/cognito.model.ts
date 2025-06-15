export type CognitoSingUpParams = {
  username: string;
  email: string;
  password: string;
};

export type CognitoSingUpDelivery = {
  method: string;
  destination: string;
};

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
