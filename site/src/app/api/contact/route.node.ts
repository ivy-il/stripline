import { NextResponse } from "next/server";

const WP = process.env.WP_API_URL?.replace(/\/$/, "");

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, string> | null;
  if (!body || !body.name || !body.email) return NextResponse.json({ error: "missing fields" }, { status: 400 });
  if (body.website) return NextResponse.json({ ok: true }); // honeypot

  const lead = {
    name: String(body.name).slice(0, 200),
    email: String(body.email).slice(0, 200),
    phone: String(body.phone ?? "").slice(0, 50),
    role: String(body.role ?? "").slice(0, 100),
    message: String(body.message ?? "").slice(0, 4000),
    product: String(body.product ?? "").slice(0, 100),
  };

  if (WP) {
    const res = await fetch(`${WP}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Stripline-Secret": process.env.REVALIDATE_SECRET ?? "" },
      body: JSON.stringify(lead),
    });
    if (!res.ok) return NextResponse.json({ error: "wp failed" }, { status: 502 });
  } else {
    console.log("[contact] (no WordPress configured) lead:", lead);
  }
  return NextResponse.json({ ok: true });
}
