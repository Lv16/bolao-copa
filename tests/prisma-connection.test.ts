import test from "node:test";
import assert from "node:assert/strict";

import { createPrismaAdapter } from "../lib/prisma";

test("postgres adapter connects using DATABASE_URL", async () => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL must be configured for this test");

  const adapter = createPrismaAdapter(process.env.DATABASE_URL!);
  const connection = await adapter.connect();

  const result = await connection.queryRaw({
    sql: "select 1 as ok",
    args: [],
    argTypes: [],
  });

  assert.equal(result.rows[0]?.[0], 1);

  await connection.dispose();
});
