import { z } from 'zod';

export const codeDeliveryDetailsSchema = z
  .object({
    DeliveryMedium: z.string(),
    AttributeName: z.string(),
    Destination: z.string(),
  })
  .transform(data => ({
    deliveryMedium: data.DeliveryMedium,
    method: data.DeliveryMedium,
    destination: data.Destination,
  }));

export const cognitoSingUpResultSchema = z
  .object({
    UserSub: z.string(),
    UserConfirmed: z.boolean(),
    CodeDeliveryDetails: codeDeliveryDetailsSchema,
  })
  .transform(data => ({
    userSub: data.UserSub,
    isConfirmed: data.UserConfirmed,
    delivery: data.CodeDeliveryDetails,
  }));

export const cognitoLoginResultSchema = z
  .object({
    AuthenticationResult: z.object({
      AccessToken: z.string(),
      ExpiresIn: z.number(),
      TokenType: z.string(),
      RefreshToken: z.string(),
      IdToken: z.string(),
    }),
  })
  .transform(data => ({
    accessToken: data.AuthenticationResult.AccessToken,
    expiresIn: data.AuthenticationResult.ExpiresIn,
    tokenType: data.AuthenticationResult.TokenType,
    refreshToken: data.AuthenticationResult.RefreshToken,
    idToken: data.AuthenticationResult.IdToken,
  }));
