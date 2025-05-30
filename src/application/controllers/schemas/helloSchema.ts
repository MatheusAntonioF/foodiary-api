import { z } from "zod";

export const schema = z.object({
    account: z.object({
        id: z.string(),
    }),
});

export type HelloBody = z.infer<typeof schema>;
