"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";

async function requireAdmin() {
  const { supabase, user, profile } = await requireActiveUser();
  if (profile?.role !== "admin") {
    redirect("/?error=Unauthorized: Admin access required");
  }
  return { supabase, user, profile };
}

export async function updateUserStatus(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const targetUserId = String(formData.get("target_user_id") || "");
  const status = String(formData.get("status") || "active");

  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", targetUserId);

  if (!error) {
    await supabase.from("admin_action_logs").insert({
      admin_id: user.id,
      target_user_id: targetUserId,
      action: `Set user status to ${status}`,
      notes: `Admin changed status to ${status}`,
    });
  }

  revalidatePath("/admin");
  redirect("/admin?success=User status updated");
}

export async function updateUserRole(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const targetUserId = String(formData.get("target_user_id") || "");
  const role = String(formData.get("role") || "user");

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", targetUserId);

  if (!error) {
    await supabase.from("admin_action_logs").insert({
      admin_id: user.id,
      target_user_id: targetUserId,
      action: `Set user role to ${role}`,
      notes: `Admin changed role to ${role}`,
    });
  }

  revalidatePath("/admin");
  redirect("/admin?success=User role updated");
}

export async function approveActivity(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const activityId = String(formData.get("activity_id") || "");

  const { error } = await supabase
    .from("activities")
    .update({ is_approved: true })
    .eq("activity_id", activityId);

  if (!error) {
    await supabase.from("admin_action_logs").insert({
      admin_id: user.id,
      action: "Approve activity",
      notes: `Approved activity ID ${activityId}`,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/activities");
  redirect("/admin?success=Activity approved!");
}

export async function rejectActivity(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const activityId = String(formData.get("activity_id") || "");

  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("activity_id", activityId);

  if (!error) {
    await supabase.from("admin_action_logs").insert({
      admin_id: user.id,
      action: "Reject activity",
      notes: `Rejected/deleted activity ID ${activityId}`,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/activities");
  redirect("/admin?success=Activity rejected and removed");
}
