import { idSchema } from '@schemas/common.schema';
import { z } from 'zod';

export type IdDto = z.infer<typeof idSchema>;

export type SuccessResultDto = {
  success: boolean;
};
