// src/app/api/or-ping/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const key = (process.env.OPENROUTER_API_KEY ?? "").trim();
  const referer = (process.env.APP_URL ?? "https://covaposh-catalog.vercel.app").trim();

  try {
    if (!key) {
      return NextResponse.json(
        { ok: false, at: "env", error: "OPENROUTER_API_KEY kosong" },
        { status: 500 }
      );
    }

    const res = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      cache: "no-store",
      redirect: "manual", // deteksi redirect
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        "HTTP-Referer": referer,
        Referer: referer,
        "X-Title": "COVAPOSH Catalog",
      },
    });

    const ctype = (res.headers.get("content-type") || "").toLowerCase();
    const raw = await res.text();

    const body =
      ctype.includes("application/json")
        ? (() => {
            try {
              return JSON.parse(raw) as unknown;
            } catch {
              return { parseError: true, snippet: raw.slice(0, 300) };
            }
          })()
        : { nonJsonSnippet: raw.slice(0, 600) };

    return NextResponse.json(
      {
        ok: res.ok && ctype.includes("application/json"),
        status: res.status,
        contentType: ctype,
        body,
      },
      { status: 200 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, at: "fetch", error: message },
      { status: 500 }
    );
  }
}
