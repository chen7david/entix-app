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
