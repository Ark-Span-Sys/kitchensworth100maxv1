import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/uploads
 * Admin-only. Returns a signed Supabase Storage upload URL for the
 * `menu-images` bucket. Client PUTs the file directly to the URL.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const filename: string = body.filename ?? `image-${Date.now()}.jpg`;
  const contentType: string = body.contentType ?? "image/jpeg";

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("menu-images")
    .createSignedUploadUrl(`menu/${Date.now()}-${filename}`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
    contentType,
  });
}
