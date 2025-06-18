export type AccessTokenPayloadResult = {
  sub: string;
  roles: string[];
};

export type RefreshTokenPayloadResult = {
  sub: string;
};
