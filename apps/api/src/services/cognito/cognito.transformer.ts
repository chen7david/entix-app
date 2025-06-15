import { z } from 'zod';

export const cognitoSingUpResultSchema = z
  .object({
    UserSub: z.string(),
    UserConfirmed: z.boolean(),
    CodeDeliveryDetails: z.object({
      DeliveryMedium: z.string(),
      AttributeName: z.string(),
      Destination: z.string(),
    }),
  })
  .transform(data => ({
    userSub: data.UserSub,
    isConfirmed: data.UserConfirmed,
    delivery: {
      method: data.CodeDeliveryDetails.DeliveryMedium,
      destination: data.CodeDeliveryDetails.Destination,
    },
  }));
