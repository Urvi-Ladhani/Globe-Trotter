import Link from "next/link";
import { requireActiveUser } from "@/lib/auth";
import type { Tables } from "@/lib/database.types";
import { Nav } from "@/components/nav";
import { ImageUploadInput } from "@/components/image-upload-input";
import { createPost, togglePostLike, addPostComment } from "@/lib/actions/community";
import { cloneTripAction } from "@/lib/actions/trips";
import {
  Globe,
  Copy,
  Edit3,
  Compass,
  Star,
  Heart,
  MessageCircle,
  Send,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

type CommentRow = Tables<"post_comments">;

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { supabase, user, profile } = await requireActiveUser();
  const { error, success } = await searchParams;

  // 1. Fetch public itineraries created by the community
  const { data: publicTrips } = await supabase
    .from("trips")
    .select("trip_id, name, description, start_date, end_date, share_token, user_id")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(6);

  // 2. Fetch posts ordered by newest
  const { data: posts } = await supabase
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false });

  // 3. Fetch author profiles for all posts and public trips
  const userIds = Array.from(
    new Set([
      ...(posts ?? []).map((p) => p.user_id),
      ...(publicTrips ?? []).map((t) => t.user_id),
    ])
  );

  const { data: authors } = userIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name, photo_url").in("id", userIds)
    : { data: [] };
  const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));

  // 4. Fetch likes for all posts
  const postIds = (posts ?? []).map((p) => p.post_id);
  const { data: likes } = postIds.length
    ? await supabase.from("post_likes").select("post_id, user_id").in("post_id", postIds)
    : { data: [] };

  const likesByPost: Record<string, string[]> = {};
  for (const l of likes ?? []) {
    (likesByPost[l.post_id] ??= []).push(l.user_id);
  }

  // 5. Fetch comments for all posts
  const { data: comments } = postIds.length
    ? await supabase
        .from("post_comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const commentsByPost: Record<string, CommentRow[]> = {};
  const commentAuthorIds: string[] = [];
  for (const c of (comments ?? []) as CommentRow[]) {
    (commentsByPost[c.post_id] ??= []).push(c);
    commentAuthorIds.push(c.user_id);
  }

  // 6. Fetch authors for comments
  const uniqueCommentAuthorIds = Array.from(new Set(commentAuthorIds));
  const { data: commentAuthors } = uniqueCommentAuthorIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name, photo_url").in("id", uniqueCommentAuthorIds)
    : { data: [] };
  const commentAuthorMap = new Map((commentAuthors ?? []).map((a) => [a.id, a]));

  // 7. User's trips for linking in post
  const { data: userTrips } = await supabase
    .from("trips")
    .select("trip_id, name")
    .eq("user_id", user.id);

  // 8. Popular activities for linking in post
  const { data: popularActivities } = await supabase
    .from("activities")
    .select("activity_id, name")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(10);

  // 9. Linked trip & activity maps
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
    <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />

      {/* Header Banner */}
      <div className="border-b border-teal-900/10 bg-gradient-to-b from-[#E0F2FE]/40 to-transparent py-8 px-4">
        <div className="mx-auto max-w-4xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0891B2]">Traveler Community</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Community Feed & Itineraries</h1>
          <p className="mt-1 text-sm text-slate-600">Discover public itineraries, clone trip templates, and share travel stories.</p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-4xl px-4 py-8 space-y-10">
        {error ? <p className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">{error}</p> : null}
        {success ? <p className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200">{success}</p> : null}

        {/* Public Itineraries Showcase */}
        {(publicTrips ?? []).length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#0891B2]" />
                <span className="text-base font-bold text-slate-900">Featured Public Itineraries</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  {publicTrips?.length} Available
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(publicTrips ?? []).map((pt) => {
                const creator = authorMap.get(pt.user_id);
                const creatorName = creator ? `${creator.first_name} ${creator.last_name ?? ""}`.trim() : "Traveler";

                return (
                  <div key={pt.trip_id} className="pacific-card pacific-card-hover p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#0891B2]">Public Trip</span>
                      <h3 className="font-bold text-slate-900 text-base mt-0.5">{pt.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        By <span className="text-slate-800 font-semibold">{creatorName}</span>
                      </p>
                      {pt.description ? <p className="text-xs text-slate-600 mt-2 line-clamp-2">{pt.description}</p> : null}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      {pt.share_token ? (
                        <Link
                          href={`/trips/share/${pt.share_token}`}
                          className="font-bold text-[#0891B2] hover:underline flex items-center gap-1"
                        >
                          <span>View Itinerary</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ) : null}

                      <form action={cloneTripAction}>
                        <input type="hidden" name="source_trip_id" value={pt.trip_id} />
                        <button
                          type="submit"
                          className="rounded bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-[#0891B2] hover:bg-sky-100 flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Clone</span>
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Create Post Card */}
        <section className="pacific-card p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0891B2] text-white">
              <Edit3 className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-base font-bold text-slate-900">Share with the Community</h2>
          </div>

          <form action={createPost} className="mt-4 flex flex-col gap-3.5 text-xs font-semibold text-slate-700">
            <textarea
              name="content"
              required
              rows={3}
              placeholder="What did you discover on your recent trip? Share tips, highlights, or recommendations..."
              className="pacific-input w-full text-xs font-normal"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <select name="trip_id" className="pacific-input text-xs">
                <option value="">Link a trip (optional)...</option>
                {userTrips?.map((t) => (
                  <option key={t.trip_id} value={t.trip_id}>
                    Trip: {t.name}
                  </option>
                ))}
              </select>

              <select name="activity_id" className="pacific-input text-xs">
                <option value="">Link an activity (optional)...</option>
                {popularActivities?.map((a) => (
                  <option key={a.activity_id} value={a.activity_id}>
                    Activity: {a.name}
                  </option>
                ))}
              </select>
            </div>

            <ImageUploadInput
              name="image_url"
              label="Post Photo (optional)"
              folder="posts"
              placeholder="https://example.com/photo.jpg"
            />

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="btn-coral px-6 py-2.5 text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Publish Post</span>
              </button>
            </div>
          </form>
        </section>

        {/* Community Feed */}
        <div className="space-y-6">
          {(posts ?? []).length === 0 ? (
            <div className="pacific-card p-12 text-center text-sm text-slate-500">
              No posts yet. Be the first to share an update with the traveler community!
            </div>
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
                <article key={post.post_id} className="pacific-card p-6">
                  {/* Post Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {author?.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={author.photo_url}
                          alt={authorName}
                          className="h-10 w-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-[#0B4F6C] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {author?.first_name?.[0] ?? "U"}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm text-slate-900">{authorName}</p>
                        <p className="text-[11px] text-slate-400 font-medium">
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
                  <p className="mt-3 text-sm text-slate-800 whitespace-pre-line leading-relaxed">{post.content}</p>

                  {/* Attached Image */}
                  {post.image_url ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.image_url}
                        alt="Post media"
                        className="max-h-96 w-full object-cover"
                      />
                    </div>
                  ) : null}

                  {/* Linked Tags */}
                  {(linkedTrip || linkedAct) ? (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {linkedTrip ? (
                        <Link
                          href={`/trips/${linkedTrip.trip_id}`}
                          className="rounded-full bg-sky-50 px-2.5 py-1 text-[#0891B2] font-semibold border border-sky-200 hover:bg-sky-100 flex items-center gap-1"
                        >
                          <Compass className="h-3 w-3" />
                          <span>Trip: {linkedTrip.name}</span>
                        </Link>
                      ) : null}
                      {linkedAct ? (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800 font-semibold border border-amber-200 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>Activity: {linkedAct.name}</span>
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Likes & Comments Bar */}
                  <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs">
                    <form action={togglePostLike}>
                      <input type="hidden" name="post_id" value={post.post_id} />
                      <input type="hidden" name="is_liked" value={isLiked ? "true" : "false"} />
                      <button
                        type="submit"
                        className={`flex items-center gap-1.5 font-bold transition-colors ${
                          isLiked ? "text-[#FF5A5F]" : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${isLiked ? "fill-[#FF5A5F]" : ""}`} />
                        <span>{postLikes.length} {postLikes.length === 1 ? "Like" : "Likes"}</span>
                      </button>
                    </form>

                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>{postComments.length} Comments</span>
                    </span>
                  </div>

                  {/* Comments List */}
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    {postComments.map((c) => {
                      const commentAuthor = commentAuthorMap.get(c.user_id);
                      const cName = commentAuthor
                        ? `${commentAuthor.first_name} ${commentAuthor.last_name ?? ""}`.trim()
                        : "Traveler";

                      return (
                        <div key={c.comment_id} className="rounded-lg bg-slate-50 p-2.5 text-xs">
                          <span className="font-bold text-slate-900">{cName}: </span>
                          <span className="text-slate-700">{c.content}</span>
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
                        className="pacific-input flex-1 text-xs py-1.5"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-[#0B4F6C] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#0E6C8F] flex items-center gap-1"
                      >
                        <Send className="h-3 w-3" />
                        <span>Reply</span>
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
