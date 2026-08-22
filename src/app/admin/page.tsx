import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { Nav } from "@/components/nav";
import {
  updateUserStatus,
  updateUserRole,
  approveActivity,
  rejectActivity,
} from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { supabase, profile } = await requireActiveUser();
  const { success, error } = await searchParams;

  if (profile?.role !== "admin") {
    redirect("/?error=Unauthorized: Admin access required");
  }

  // 1. Fetch counts & aggregate stats
  const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { count: tripsCount } = await supabase.from("trips").select("*", { count: "exact", head: true });
  const { count: activitiesCount } = await supabase.from("activities").select("*", { count: "exact", head: true });
  const { count: postsCount } = await supabase.from("community_posts").select("*", { count: "exact", head: true });

  // 2. Fetch pending activities (is_approved = false)
  const { data: pendingActivities } = await supabase
    .from("activities")
    .select("*")
    .eq("is_approved", false)
    .order("created_at", { ascending: false });

  const pendingCityIds = (pendingActivities ?? []).map((a) => a.city_id);
  const { data: cities } = pendingCityIds.length
    ? await supabase.from("cities").select("city_id, name, country").in("city_id", pendingCityIds)
    : { data: [] };
  const cityMap = new Map((cities ?? []).map((c) => [c.city_id, c]));

  // 3. Fetch users for user management
  const { data: allUsers } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  // 4. Fetch popular destinations
  const { data: popularCities } = await supabase
    .from("cities")
    .select("*")
    .order("popularity_score", { ascending: false })
    .limit(8);

  // 5. Fetch recent admin audit logs
  const { data: auditLogs } = await supabase
    .from("admin_action_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex min-h-screen flex-col">
      <Nav profile={profile} isAdmin={true} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div>
          <span className="rounded bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white uppercase tracking-wider">
            Admin Console
          </span>
          <h1 className="mt-2 text-2xl font-bold">Platform Management & Moderation</h1>
          <p className="text-sm text-zinc-500">Monitor system activity, approve user-submitted catalog entries, and manage user accounts.</p>
        </div>

        {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {success ? <p className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}

        {/* Global Metric Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500 uppercase">Total Users</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{usersCount ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500 uppercase">Total Trips</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{tripsCount ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500 uppercase">Total Activities</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{activitiesCount ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500 uppercase">Community Posts</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{postsCount ?? 0}</p>
          </div>
        </div>

        {/* Pending Activity Moderation */}
        <section className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Pending Activities for Review ({pendingActivities?.length ?? 0})
            </h2>
          </div>

          {(pendingActivities ?? []).length === 0 ? (
            <p className="mt-4 text-xs text-zinc-500">No pending activity submissions to moderate right now.</p>
          ) : (
            <div className="mt-4 divide-y">
              {pendingActivities?.map((act) => {
                const city = cityMap.get(act.city_id);
                return (
                  <div key={act.activity_id} className="flex flex-wrap items-center justify-between py-3 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{act.name}</h3>
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700 font-medium">
                          {act.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        City: {city?.name ?? act.city_id} {city?.country ? `(${city.country})` : ""}
                        {act.cost_estimate_inr ? ` · Cost: ₹${act.cost_estimate_inr}` : ""}
                        {act.duration_minutes ? ` · Duration: ${act.duration_minutes}m` : ""}
                      </p>
                      {act.description ? <p className="text-xs text-zinc-600 mt-1">{act.description}</p> : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <form action={approveActivity}>
                        <input type="hidden" name="activity_id" value={act.activity_id} />
                        <button
                          type="submit"
                          className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={rejectActivity}>
                        <input type="hidden" name="activity_id" value={act.activity_id} />
                        <button
                          type="submit"
                          className="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* User Management */}
        <section className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">User Management</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-zinc-50 font-semibold text-zinc-600">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(allUsers ?? []).map((u) => {
                  const isSelf = u.id === profile.id;
                  return (
                    <tr key={u.id}>
                      <td className="px-3 py-2.5 font-medium">
                        {u.first_name} {u.last_name ?? ""}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500">
                        {u.home_city ?? "—"}, {u.home_country ?? "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <form action={updateUserRole} className="inline-block">
                          <input type="hidden" name="target_user_id" value={u.id} />
                          <select
                            name="role"
                            defaultValue={u.role}
                            disabled={isSelf}
                            onChange={(e) => e.target.form?.requestSubmit()}
                            className="rounded border px-1.5 py-0.5 text-xs capitalize"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </form>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            u.status === "suspended" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {!isSelf ? (
                          <form action={updateUserStatus} className="inline-block">
                            <input type="hidden" name="target_user_id" value={u.id} />
                            <input
                              type="hidden"
                              name="status"
                              value={u.status === "suspended" ? "active" : "suspended"}
                            />
                            <button
                              type="submit"
                              className={`text-xs hover:underline ${
                                u.status === "suspended" ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              {u.status === "suspended" ? "Reinstate" : "Suspend"}
                            </button>
                          </form>
                        ) : (
                          <span className="text-zinc-400">Current User</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Analytics & Audit Log Grid */}
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {/* Popular Cities Analytics */}
          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Top Popular Destinations</h2>
            <div className="mt-3 space-y-2 text-xs">
              {popularCities?.map((c, i) => (
                <div key={c.city_id} className="flex items-center justify-between rounded border p-2">
                  <span className="font-medium">{i + 1}. {c.name}, {c.country}</span>
                  <span className="text-zinc-500 font-semibold">Score: {c.popularity_score}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Admin Action Logs */}
          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Admin Audit Logs</h2>
            <div className="mt-3 space-y-2 text-xs max-h-64 overflow-y-auto">
              {(auditLogs ?? []).length === 0 ? (
                <p className="text-zinc-400">No action logs recorded yet.</p>
              ) : (
                auditLogs?.map((log) => (
                  <div key={log.log_id} className="rounded border p-2 bg-zinc-50">
                    <p className="font-semibold text-zinc-900">{log.action}</p>
                    {log.notes ? <p className="text-zinc-500">{log.notes}</p> : null}
                    <p className="text-[10px] text-zinc-400 mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
