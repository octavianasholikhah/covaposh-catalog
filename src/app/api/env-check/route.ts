export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const hasSupabaseURL = !!process.env.SUPABASE_URL;
  const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return Response.json({
    runtime: "nodejs",
    envSeen: {
      OPENAI_API_KEY: hasOpenAI,
      OPENROUTER_API_KEY: hasOpenRouter,
      SUPABASE_URL: hasSupabaseURL,
      SUPABASE_SERVICE_ROLE_KEY: hasSupabaseKey,
    },
  });
}
