import { z } from "zod";
import { requireAuth } from "./auth";

type AuthenticatedActionHandler<TInput, TOutput> = (args: {
  input: TInput;
  userId: number;
}) => Promise<TOutput>;

export function authenticatedAction<TInput, TOutput>(
  schema: z.ZodType<TInput>,
  handler: AuthenticatedActionHandler<TInput, TOutput>
) {
  return async (input: unknown): Promise<TOutput> => {
    // 1. Authenticate user first
    const { userId } = await requireAuth();
    
    // 2. Validate input schema
    const parsedInput = schema.parse(input);
    
    // 3. Execute business logic
    return handler({ input: parsedInput, userId });
  };
}
