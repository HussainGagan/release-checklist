import { createYoga } from "graphql-yoga";
import { graphQLSchema } from "./schema";

export const yoga = createYoga({
  schema: graphQLSchema,
  graphqlEndpoint: "/api/graphql",
  graphiql: process.env.NODE_ENV !== "production",
});
