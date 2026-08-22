"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, emptyToNull } from "@/lib/auth";

export async function createPost(formData: FormData) {
  const { supabase, user } = await requireUser();
  const content = String(formData.get("content") || "").trim();
  const imageUrl = emptyToNull(formData.get("image_url"));
  const tripId = emptyToNull(formData.get("trip_id"));
  const activityId = emptyToNull(formData.get("activity_id"));

  if (!content) {
    redirect("/community?error=Post content is required");
  }

  const { error } = await supabase.from("community_posts").insert({
    user_id: user.id,
    content,
    image_url: imageUrl,
    trip_id: tripId,
    activity_id: activityId,
  });

  if (error) {
    redirect(`/community?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/community");
  redirect("/community?success=Post published!");
}

export async function togglePostLike(formData: FormData) {
  const { supabase, user } = await requireUser();
  const postId = String(formData.get("post_id") || "");
  const isLiked = formData.get("is_liked") === "true";

  if (isLiked) {
    await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
  } else {
    await supabase.from("post_likes").insert({
      post_id: postId,
      user_id: user.id,
    });
  }

  revalidatePath("/community");
  redirect("/community");
}

export async function addPostComment(formData: FormData) {
  const { supabase, user } = await requireUser();
  const postId = String(formData.get("post_id") || "");
  const content = String(formData.get("content") || "").trim();

  if (!postId || !content) {
    redirect("/community?error=Comment cannot be empty");
  }

  const { error } = await supabase.from("post_comments").insert({
    post_id: postId,
    user_id: user.id,
    content,
  });

  if (error) {
    redirect(`/community?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/community");
  redirect("/community");
}
