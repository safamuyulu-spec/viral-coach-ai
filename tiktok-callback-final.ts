Deno.serve(async (req) => {
  const params = new URL(req.url).searchParams;
  const code = params.get("code");
  if (!code) {
    return new Response("Connexion annulée ou erreur : " + (params.get("error") ?? "code manquant"), { status: 400 });
  }

  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: Deno.env.get("TIKTOK_CLIENT_KEY")!,
      client_secret: Deno.env.get("TIKTOK_CLIENT_SECRET")!,
      code,
      grant_type: "authorization_code",
      redirect_uri: "https://iffcoaqnegafqvsoslxf.supabase.co/functions/v1/tiktok-callback",
    }),
  });
  const token = await tokenRes.json();
  if (!token.access_token) {
    return new Response("Échec de la connexion : " + JSON.stringify(token), { status: 400 });
  }

  const infoRes = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=display_name,follower_count,likes_count,video_count",
    { headers: { Authorization: `Bearer ${token.access_token}` } },
  );
  const info = await infoRes.json();
  const u = info.data?.user ?? {};

  const site = new URL("https://safamuyulu-spec.github.io/viral-coach-ai/");
  site.searchParams.set("name", u.display_name ?? "");
  site.searchParams.set("followers", String(u.follower_count ?? 0));
  site.searchParams.set("likes", String(u.likes_count ?? 0));
  site.searchParams.set("videos", String(u.video_count ?? 0));
  return Response.redirect(site.toString(), 302);
});
