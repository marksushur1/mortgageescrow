import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureTables } from "@/lib/init";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  await ensureTables();
  const { rows } = await sql`SELECT * FROM orders ORDER BY id DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  await ensureTables();
  const data = await req.json();
  if (!data?.customer_name) return NextResponse.json({ error: "customer_name is required" }, { status: 400 });
  const total = Number(data.total ?? 0);
  const { rows } = await sql`
    INSERT INTO orders (customer_name, total)
    VALUES (${data.customer_name}, ${isFinite(total) ? total : 0})
    RETURNING *`;
  return NextResponse.json(rows[0], { status: 201 });
}
