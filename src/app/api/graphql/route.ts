import { yoga } from "@/graphql/server";

export const runtime = "nodejs";

function handleRequest(request: Request) {
  return yoga.handleRequest(request, {});
}

export { handleRequest as GET, handleRequest as POST, handleRequest as OPTIONS };
