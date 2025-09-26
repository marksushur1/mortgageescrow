import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureTables } from "@/lib/init";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  await ensureTables();
  const { rows } = await sql`SELECT * FROM customers ORDER BY id DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  await ensureTables();
  const data = await req.json();
  if (!data?.name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  const { rows } = await sql`
    INSERT INTO customers (name, email)
    VALUES (${data.name}, ${data.email ?? null})
    RETURNING *`;
  return NextResponse.json(rows[0], { status: 201 });
}
