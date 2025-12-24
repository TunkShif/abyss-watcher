import * as v from "valibot";

/**
 * Parses URL search parameters from a Request object using a given Valibot schema.
 * 
 * @param schema - The Valibot schema to validate the search parameters against.
 * @param request - The incoming Request object containing the URL search parameters.
 * @returns The parsed and validated search parameters.
 * @throws {v.ValiError} If the search parameters do not match the schema.
 */
export const parseSearchParams = <const TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
  schema: TSchema,
  request: Request,
) => v.parse(schema, Object.fromEntries(new URL(request.url).searchParams.entries()));

