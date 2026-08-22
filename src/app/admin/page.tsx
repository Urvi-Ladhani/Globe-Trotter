import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { approveActivity, rejectActivity, updateUserStatus, updateUserRole } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

type AdminSearchParams = {
  error?: string;
  success?: string;
  q?: string;
  status?: string;
  sort?: string;
  group?: string;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const { supabase, user, profile } = await requireAdmin();
  const { error, success, q = "", status = "all", sort = "recent", group = "role" } = await searchParams;
  const normalizedQuery = q.trim().toLowerCase();

  // 1. Analytics & Stats
  const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { count: activeUserCount } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active");
  const { count: suspendedUserCount } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "suspended");
  const { count: tripCount } = await supabase.from("trips").select("*", { count: "exact", head: true });
  const { count: activityCount } = await supabase.from("activities").select("*", { count: "exact", head: true });
  const { count: pendingActCount } = await supabase
    .from("activities")
    .select("*", { count: "exact", head: true })
    .eq("is_approved", false);

  // 2. Pending Activities for Moderation
  const { data: pendingActivities } = await supabase
    .from("activities")
    .select("*")
    .eq("is_approved", false)
    .order("created_at", { ascending: false });

  const pendingCityIds = (pendingActivities ?? []).map((a) => a.city_id);
  const { data: pendingCities } = pendingCityIds.length
    ? await supabase.from("cities").select("city_id, name, country").in("city_id", pendingCityIds)
    : { data: [] };
  const cityMap = new Map((pendingCities ?? []).map((c) => [c.city_id, c]));

  // 3. User Management list
  const { data: allUsers } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const visibleUsers = (allUsers ?? [])
    .filter((candidate) => {
      const name = `${candidate.first_name} ${candidate.last_name ?? ""}`.toLowerCase();
      const location = `${candidate.home_city ?? ""} ${candidate.home_country ?? ""}`.toLowerCase();
      return (!normalizedQuery || name.includes(normalizedQuery) || location.includes(normalizedQuery) || candidate.role.includes(normalizedQuery)) &&
        (status === "all" || candidate.status === status);
    })
    .sort((left, right) => {
      if (group === "role" && left.role !== right.role) return left.role.localeCompare(right.role);
      if (group === "status" && left.status !== right.status) return left.status.localeCompare(right.status);
      if (group === "location") {
        const leftLocation = `${left.home_country ?? ""} ${left.home_city ?? ""}`;
        const rightLocation = `${right.home_country ?? ""} ${right.home_city ?? ""}`;
        if (leftLocation !== rightLocation) return leftLocation.localeCompare(rightLocation);
      }
      if (sort === "name") return `${left.first_name} ${left.last_name ?? ""}`.localeCompare(`${right.first_name} ${right.last_name ?? ""}`);
      if (sort === "status") return left.status.localeCompare(right.status);
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });

  // 4. Audit Logs
  const { data: auditLogs } = await supabase
    .from("admin_action_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="admin-shell flex min-h-screen flex-col">
      <Nav profile={profile} isAdmin={true} />
      <div className="admin-frame">
      <form className="admin-toolbar" method="get">
        <label className="admin-search"><span aria-hidden="true">?</span><input name="q" defaultValue={q} placeholder="Search users, roles, locations..." /></label>
        <label><span>Group by</span><select name="group" defaultValue={group}><option value="role">Role</option><option value="status">Status</option><option value="location">Location</option></select></label>
        <label><span>Filter</span><select name="status" defaultValue={status}><option value="all">All users</option><option value="active">Active</option><option value="suspended">Suspended</option></select></label>
        <label><span>Sort by</span><select name="sort" defaultValue={sort}><option value="recent">Recent</option><option value="name">Name</option><option value="status">Status</option></select></label>
        <button className="admin-filter-button" type="submit">Apply</button>
      </form>
      <nav className="admin-tabs" aria-label="Admin sections">
        <a href="#users">Manage Users</a><Link href="/cities">Popular Cities</Link><Link href="/activities">Popular Activities</Link><a href="#user-trends">User Trends and Analytics</a>
      </nav>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 space-y-10">
        {error ? <p className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">{error}</p> : null}
        {success ? <p className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200">{success}</p> : null}

        {/* Metric Cards */}
        <div id="analytics" className="grid grid-cols-2 gap-4 sm:grid-cols-4 admin-metrics">
          <div className="pacific-card p-5">
            <p className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider">Registered Users</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{userCount ?? 0}</p>
          </div>
          <div className="pacific-card p-5">
            <p className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider">Total Trips Created</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{tripCount ?? 0}</p>
          </div>
          <div className="pacific-card p-5">
            <p className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider">Approved Activities</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{activityCount ?? 0}</p>
          </div>
          <div className="pacific-card p-5">
            <p className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider">Pending Approvals</p>
            <p className="mt-2 text-3xl font-extrabold text-[#FF5A5F]">{pendingActCount ?? 0}</p>
          </div>
        </div>

        <section id="user-trends" className="pacific-card overflow-hidden admin-section">
          <div className="border-b border-teal-900/10 bg-slate-50/70 p-5">
            <h2 className="text-base font-bold text-slate-900">User Trends and Analytics</h2>
            <p className="mt-1 text-xs text-slate-600">Current account status across the platform.</p>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <div>
              <div className="mb-2 flex justify-between text-xs font-semibold text-slate-600"><span>Active users</span><span>{activeUserCount ?? 0}</span></div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-[#0891B2]" style={{ width: `${Math.min(((activeUserCount ?? 0) / Math.max(userCount ?? 0, 1)) * 100, 100)}%` }} /></div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs font-semibold text-slate-600"><span>Suspended users</span><span>{suspendedUserCount ?? 0}</span></div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-[#FF5A5F]" style={{ width: `${Math.min(((suspendedUserCount ?? 0) / Math.max(userCount ?? 0, 1)) * 100, 100)}%` }} /></div>
            </div>
          </div>
        </section>

        {/* Pending Activity Moderation Queue */}
        <section id="moderation" className="pacific-card overflow-hidden admin-section">
          <div className="border-b border-teal-900/10 bg-slate-50/70 p-5 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Activity Moderation Queue ({pendingActivities?.length ?? 0})
            </h2>
          </div>

          {(pendingActivities ?? []).length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400">No activities currently pending review.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingActivities?.map((act) => {
                const city = cityMap.get(act.city_id);
                return (
                  <div key={act.activity_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{act.name}</h3>
                        <span className="rounded bg-sky-50 text-[#0891B2] px-2 py-0.5 text-xs font-semibold border border-sky-200">
                          {act.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        📍 {city?.name ?? "City"}, {city?.country} · {act.duration_minutes ? `⏱ ${act.duration_minutes}m` : ""} · {act.cost_estimate_inr ? `₹${act.cost_estimate_inr}` : "Cost Varies"}
                      </p>
                      {act.description ? <p className="text-xs text-slate-600 mt-2">{act.description}</p> : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <form action={approveActivity}>
                        <input type="hidden" name="activity_id" value={act.activity_id} />
                        <button
                          type="submit"
                          className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={rejectActivity}>
                        <input type="hidden" name="activity_id" value={act.activity_id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-300 bg-white px-3.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 shadow-xs"
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
        <section id="users" className="pacific-card overflow-hidden admin-section">
          <div className="border-b border-teal-900/10 bg-slate-50/70 p-5">
            <h2 className="text-base font-bold text-slate-900">User Management</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50 font-bold text-slate-600 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleUsers.map((u) => {
                  const isSelf = u.id === user.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {u.first_name} {u.last_name ?? ""}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {u.home_city ?? "—"}, {u.home_country ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <form action={updateUserRole} className="flex items-center gap-1.5">
                          <input type="hidden" name="target_user_id" value={u.id} />
                          <select
                            name="role"
                            defaultValue={u.role}
                            disabled={isSelf}
                            className="pacific-input text-xs py-1 capitalize"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          {!isSelf ? (
                            <button
                              type="submit"
                              className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
                            >
                              Save
                            </button>
                          ) : null}
                        </form>
                      </td>
                      <td className="px-4 py-3">
                        <form action={updateUserStatus} className="flex items-center gap-1.5">
                          <input type="hidden" name="target_user_id" value={u.id} />
                          <select
                            name="status"
                            defaultValue={u.status}
                            disabled={isSelf}
                            className="pacific-input text-xs py-1 capitalize"
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                          </select>
                          {!isSelf ? (
                            <button
                              type="submit"
                              className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
                            >
                              Save
                            </button>
                          ) : null}
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Audit Logs */}
        <section className="pacific-card overflow-hidden">
          <div className="border-b border-teal-900/10 bg-slate-50/70 p-5">
            <h2 className="text-base font-bold text-slate-900">Admin Audit Trail</h2>
          </div>

          {(auditLogs ?? []).length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400">No administrative actions logged yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {auditLogs?.map((log) => (
                <div key={log.log_id} className="flex items-center justify-between p-4 text-xs">
                  <div>
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-bold uppercase text-slate-700 text-[10px]">
                      {log.action}
                    </span>
                    <span className="ml-2 font-semibold text-slate-800">
                      Target: {log.target_user_id ?? "System"} {log.notes ? `(${log.notes})` : ""}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(log.created_at).toLocaleString("en-US")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      </div>
    </div>
  );
}
