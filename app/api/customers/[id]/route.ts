import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureTables } from "@/lib/init";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  await ensureTables();
  const id = Number(params.id);
  const { rows } = await sql`SELECT * FROM customers WHERE id = ${id}`;
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PUT(req: Request, { params }: Params) {
  await ensureTables();
  const id = Number(params.id);
  const data = await req.json();
  const { rows } = await sql`
    UPDATE customers
       SET name = COALESCE(${data.name}, name),
           email = COALESCE(${data.email}, email)
     WHERE id = ${id}
  RETURNING *`;
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: Params) {
  await ensureTables();
  const id = Number(params.id);
  const { rowCount } = await sql`DELETE FROM customers WHERE id = ${id}`;
  return rowCount ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}
