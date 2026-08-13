"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type ClientPortalUser = {
  id: string;
  userId: string;
  clientId: string;
  role: "owner" | "member";
  email: string | null;
};

export function ClientUsersManager({ clientId }: { clientId: string }) {
  const [users, setUsers] = useState<ClientPortalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "member" as "owner" | "member",
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/users`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setUsers((data.users as ClientPortalUser[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function handleAdd() {
    if (!form.email.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add user");
      setOpen(false);
      setForm({ email: "", password: "", role: "member" });
      await loadUsers();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to add user");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(user: ClientPortalUser) {
    if (
      !confirm(
        `Delete ${user.email || "this user"}? They will be removed from this client and deleted from Supabase Authentication.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/clients/${clientId}/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove user");
      await loadUsers();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to remove user");
    }
  }

  return (
    <div className="admin-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-[15px] font-semibold">Portal users</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            People who can sign in at /login for this client.
          </p>
        </div>
        <Button
          size="sm"
          className="rounded-full"
          onClick={() => {
            setFormError(null);
            setForm({ email: "", password: "", role: "member" });
            setOpen(true);
          }}
        >
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
          Add User
        </Button>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-[13px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading users…
        </div>
      ) : error ? (
        <p className="mt-6 text-[13px] text-red-600">{error}</p>
      ) : users.length === 0 ? (
        <p className="mt-6 text-[13px] text-muted-foreground">
          No portal users linked yet. Add one so the client can sign in.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border/60 rounded-xl ring-1 ring-border/70">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium">
                  {user.email || "Unknown email"}
                </p>
                <p className="mt-0.5 text-[12px] capitalize text-muted-foreground">
                  {user.role}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-muted-foreground hover:text-destructive"
                onClick={() => void handleRemove(user)}
                aria-label="Remove user"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add portal user</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@company.com"
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Required for new users"
                disabled={saving}
              />
              <p className="text-[11px] text-muted-foreground">
                Leave blank if this email already has a Supabase Auth account —
                we’ll only link them to this client.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  v && setForm({ ...form, role: v as "owner" | "member" })
                }
                disabled={saving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {form.role === "owner" ? "Owner" : "Member"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && (
              <p className="text-[13px] text-red-600">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full"
              onClick={() => void handleAdd()}
              disabled={!form.email.trim() || saving}
            >
              {saving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-1.5 h-4 w-4" />
              )}
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
