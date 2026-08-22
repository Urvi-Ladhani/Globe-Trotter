import Link from "next/link";
import { requireActiveUser } from "@/lib/auth";
import type { Tables } from "@/lib/database.types";
import { Nav } from "@/components/nav";
import { createPost, togglePostLike, addPostComment } from "@/lib/actions/community";

export const dynamic = "force-dynamic";

type CommentRow = Tables<"post_comments">;

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { supabase, user, profile } = await requireActiveUser();
  const { error, success } = await searchParams;

  // 1. Fetch community posts
  const { data: posts } = await supabase
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(40);

  const postIds = (posts ?? []).map((p) => p.post_id);
  const authorIds = Array.from(new Set((posts ?? []).map((p) => p.user_id)));

  // 2. Fetch author profiles
  const { data: authorProfiles } = authorIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name, photo_url").in("id", authorIds)
    : { data: [] };
  const authorMap = new Map((authorProfiles ?? []).map((a) => [a.id, a]));

  // 3. Fetch likes for posts
  const { data: allLikes } = postIds.length
    ? await supabase.from("post_likes").select("post_id, user_id").in("post_id", postIds)
    : { data: [] };

  const likesByPost: Record<string, string[]> = {};
  for (const l of allLikes ?? []) {
    if (!likesByPost[l.post_id]) likesByPost[l.post_id] = [];
    likesByPost[l.post_id].push(l.user_id);
  }

  // 4. Fetch comments for posts
  const { data: allComments } = postIds.length
    ? await supabase
        .from("post_comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const commentUserIds = Array.from(new Set((allComments ?? []).map((c) => c.user_id)));
  const { data: commentAuthorProfiles } = commentUserIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", commentUserIds)
    : { data: [] };
  const commentAuthorMap = new Map((commentAuthorProfiles ?? []).map((a) => [a.id, a]));

  const commentsByPost: Record<string, CommentRow[]> = {};
  for (const c of (allComments ?? []) as CommentRow[]) {
    if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
    commentsByPost[c.post_id].push(c);
  }

  // 5. Fetch user's trips and approved activities for "create post" dropdown
  const { data: userTrips } = await supabase
    .from("trips")
    .select("trip_id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: popularActivities } = await supabase
    .from("activities")
    .select("activity_id, name")
    .eq("is_approved", true)
    .limit(20);

  // 6. Linked trip & activity maps
  const linkedTripIds = (posts ?? []).map((p) => p.trip_id).filter((id): id is string => !!id);
  const { data: linkedTrips } = linkedTripIds.length
    ? await supabase.from("trips").select("trip_id, name").in("trip_id", linkedTripIds)
    : { data: [] };
  const tripMap = new Map((linkedTrips ?? []).map((t) => [t.trip_id, t]));

  const linkedActIds = (posts ?? []).map((p) => p.activity_id).filter((id): id is string => !!id);
  const { data: linkedActs } = linkedActIds.length
    ? await supabase.from("activities").select("activity_id, name").in("activity_id", linkedActIds)
    : { data: [] };
  const actMap = new Map((linkedActs ?? []).map((a) => [a.activity_id, a]));

  return (
    <div className="flex min-h-screen flex-col">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">Traveler Community</h1>
          <p className="text-sm text-zinc-500">Share your travel memories, itinerary highlights, and advice with fellow explorers.</p>
        </div>

        {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {success ? <p className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}

        {/* Create Post Card */}
        <section className="mt-6 rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Share with the Community</h2>
          <form action={createPost} className="mt-3 flex flex-col gap-3">
            <textarea
              name="content"
              required
              rows={3}
              placeholder="What did you discover on your recent trip? Share tips, highlights..."
              className="rounded-lg border px-3 py-2 text-sm"
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <select name="trip_id" className="rounded-lg border px-3 py-1.5 text-xs">
                <option value="">Link a trip (optional)...</option>
                {userTrips?.map((t) => (
                  <option key={t.trip_id} value={t.trip_id}>
                    Trip: {t.name}
                  </option>
                ))}
              </select>

              <select name="activity_id" className="rounded-lg border px-3 py-1.5 text-xs">
                <option value="">Link an activity (optional)...</option>
                {popularActivities?.map((a) => (
                  <option key={a.activity_id} value={a.activity_id}>
                    Activity: {a.name}
                  </option>
                ))}
              </select>

              <input
                name="image_url"
                placeholder="Image URL (optional)"
                className="rounded-lg border px-3 py-1.5 text-xs"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
              >
                Publish Post
              </button>
            </div>
          </form>
        </section>

        {/* Community Feed */}
        <div className="mt-8 space-y-6">
          {(posts ?? []).length === 0 ? (
            <p className="rounded-lg border bg-white p-8 text-center text-sm text-zinc-500">
              No posts yet. Be the first to share an update!
            </p>
          ) : (
            (posts ?? []).map((post) => {
              const author = authorMap.get(post.user_id);
              const authorName = author ? `${author.first_name} ${author.last_name ?? ""}`.trim() : "Traveler";
              const postLikes = likesByPost[post.post_id] ?? [];
              const isLiked = postLikes.includes(user.id);
              const postComments = commentsByPost[post.post_id] ?? [];
              const linkedTrip = post.trip_id ? tripMap.get(post.trip_id) : null;
              const linkedAct = post.activity_id ? actMap.get(post.activity_id) : null;

              return (
                <article key={post.post_id} className="rounded-lg border bg-white p-5 shadow-sm">
                  {/* Post Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-xs text-zinc-600">
                        {author?.first_name?.[0] ?? "U"}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-zinc-900">{authorName}</p>
                        <p className="text-xs text-zinc-400">
                          {new Date(post.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="mt-3 text-sm text-zinc-800 whitespace-pre-line">{post.content}</p>

                  {/* Linked Tags */}
                  {(linkedTrip || linkedAct) ? (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {linkedTrip ? (
                        <span className="rounded bg-blue-50 px-2 py-1 text-blue-700 font-medium">
                          ✈ Trip: {linkedTrip.name}
                        </span>
                      ) : null}
                      {linkedAct ? (
                        <span className="rounded bg-amber-50 px-2 py-1 text-amber-700 font-medium">
                          ★ Activity: {linkedAct.name}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Likes & Comments Bar */}
                  <div className="mt-4 flex items-center gap-4 border-t pt-3 text-xs">
                    <form action={togglePostLike}>
                      <input type="hidden" name="post_id" value={post.post_id} />
                      <input type="hidden" name="is_liked" value={isLiked ? "true" : "false"} />
                      <button
                        type="submit"
                        className={`flex items-center gap-1 font-semibold ${
                          isLiked ? "text-red-600" : "text-zinc-600 hover:text-zinc-900"
                        }`}
                      >
                        {isLiked ? "♥" : "♡"} {postLikes.length} {postLikes.length === 1 ? "Like" : "Likes"}
                      </button>
                    </form>

                    <span className="text-zinc-400">·</span>
                    <span className="text-zinc-500">{postComments.length} Comments</span>
                  </div>

                  {/* Comments List */}
                  <div className="mt-3 space-y-2 border-t pt-3">
                    {postComments.map((c) => {
                      const commentAuthor = commentAuthorMap.get(c.user_id);
                      const cName = commentAuthor
                        ? `${commentAuthor.first_name} ${commentAuthor.last_name ?? ""}`.trim()
                        : "User";

                      return (
                        <div key={c.comment_id} className="rounded bg-zinc-50 p-2.5 text-xs">
                          <span className="font-semibold text-zinc-800">{cName}: </span>
                          <span className="text-zinc-700">{c.content}</span>
                        </div>
                      );
                    })}

                    {/* Add Comment Form */}
                    <form action={addPostComment} className="mt-2 flex gap-2">
                      <input type="hidden" name="post_id" value={post.post_id} />
                      <input
                        name="content"
                        required
                        placeholder="Write a comment..."
                        className="flex-1 rounded-lg border px-3 py-1.5 text-xs"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700"
                      >
                        Reply
                      </button>
                    </form>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
