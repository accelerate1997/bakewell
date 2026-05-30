"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Search, 
  UserCog, 
  Shield, 
  User, 
  Users,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  createdAt: string;
}

const roleStyles: Record<string, string> = {
  ADMIN: "bg-[#EEEDFE] text-[#534AB7] border-[#d7d4fb]",
  STAFF: "bg-[#FAEEDA] text-[#854F0B] border-[#f6ddb2]",
  CUSTOMER: "bg-[#EAF3DE] text-[#3B6D11] border-[#d8eabf]",
};

export function UsersClientView() {
  const { data: session, status } = useSession();
  const currentUser = session?.user as any;
  const currentUserId = currentUser?.id;
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "admin";

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An error occurred while fetching users." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Filter users based on search query and role filter
  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q)) || 
        (u.phone && u.phone.toLowerCase().includes(q))
      );
    }

    if (roleFilter !== "all") {
      result = result.filter(u => u.role === roleFilter);
    }

    return result;
  }, [users, search, roleFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.role === "ADMIN").length;
    const staff = users.filter(u => u.role === "STAFF").length;
    const customers = users.filter(u => u.role === "CUSTOMER").length;
    return { total, admins, staff, customers };
  }, [users]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8872a]" />
        <p className="text-sm font-bold uppercase tracking-wider text-[#8a8a7a]">Loading Directory...</p>
      </div>
    );
  }

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: string) => {
    // Basic client validations
    if (userId === currentUserId) {
      setStatusMessage({ type: "error", text: "You cannot demote or change your own role." });
      return;
    }

    const originalUser = users.find(u => u.id === userId);
    if (originalUser && originalUser.role === "ADMIN" && newRole !== "ADMIN") {
      const adminCount = users.filter(u => u.role === "ADMIN").length;
      if (adminCount <= 1) {
        setStatusMessage({ type: "error", text: "Cannot demote the last remaining Administrator." });
        return;
      }
    }

    try {
      setUpdatingUserId(userId);
      setStatusMessage(null);

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update user role");
      }

      setStatusMessage({ type: "success", text: `Successfully updated ${data.user.name || "user"}'s role to ${newRole}.` });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? { ...u, role: newRole as any } : u)
      );
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to update role." });
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Handle user delete
  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setDeletingUserId(userId);
      setStatusMessage(null);

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      setStatusMessage({ type: "success", text: `Successfully deleted user "${name}".` });
      
      // Update local state
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to delete user." });
    } finally {
      setDeletingUserId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100 shadow-sm animate-bounce">
          <Shield className="w-8 h-8 text-amber-600" />
        </div>
        <div className="space-y-2">
          <h2 className="font-playfair font-black text-2xl text-[#1a2c1a] uppercase tracking-tight">Access Denied</h2>
          <p className="text-xs text-[#8a8a7a] leading-relaxed">
            You must be logged in as an administrator to access user management settings. Please sign in to your admin account and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a2c1a] flex items-center gap-2">
            <UserCog size={28} className="text-[#3d5a2e]" />
            User Management
          </h1>
          <p className="text-xs text-[#8a8a7a] mt-1 font-bold uppercase tracking-wider">
            Promote, demote, and manage system roles for staff and administrators
          </p>
        </div>
        <Badge className="bg-[#3d5a2e]/10 text-[#3d5a2e] hover:bg-[#3d5a2e]/10 border-none rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest">
          {stats.total} Total Users
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Administrators", value: stats.admins.toString(), icon: Shield, bg: "bg-[#EEEDFE]", color: "text-[#534AB7]" },
          { label: "Staff Members", value: stats.staff.toString(), icon: User, bg: "bg-[#FAEEDA]", color: "text-[#854F0B]" },
          { label: "Customers", value: stats.customers.toString(), icon: Users, bg: "bg-[#EAF3DE]", color: "text-[#3B6D11]" },
        ].map((stat) => (
          <Card key={stat.label} className="p-5 border-[#d4d9b8] rounded-[8px] shadow-none bg-white flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]">{stat.label}</p>
              <h4 className="text-xl font-black text-[#1a2c1a]">{stat.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      {/* Alerts / Status Banner */}
      {statusMessage && (
        <div className={cn(
          "p-4 rounded-[8px] flex items-start gap-3 border text-xs font-bold",
          statusMessage.type === "success" 
            ? "bg-[#EAF3DE] text-[#3B6D11] border-[#d8eabf]" 
            : "bg-[#FDF2F2] text-[#9B1C1C] border-[#FBD5D5]"
        )}>
          {statusMessage.type === "success" ? (
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 border-[#d4d9b8] rounded-[8px] shadow-none bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a7a]" size={16} />
            <Input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search user name, email, or phone number..." 
              className="pl-10 h-10 border-[#d4d9b8] bg-white text-xs font-medium" 
            />
          </div>
          <Select value={roleFilter} onValueChange={(val: any) => setRoleFilter(val || "all")}>
            <SelectTrigger className="h-10 border-[#d4d9b8] bg-white text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">
              <SelectValue placeholder="Filter by Role" />
            </SelectTrigger>
            <SelectContent className="border-[#d4d9b8]">
              <SelectItem value="all" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">All Roles</SelectItem>
              <SelectItem value="ADMIN" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">ADMIN</SelectItem>
              <SelectItem value="STAFF" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">STAFF</SelectItem>
              <SelectItem value="CUSTOMER" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">CUSTOMER</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="border-[#d4d9b8] rounded-[8px] shadow-none bg-white overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#8a8a7a]">
            <Loader2 size={36} className="animate-spin text-[#3d5a2e] mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest">Loading directory...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#1a2c1a] text-white text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 font-bold">User</th>
                  <th className="px-6 py-4 font-bold">Identifier (Email/Phone)</th>
                  <th className="px-6 py-4 font-bold">Joined Date</th>
                  <th className="px-6 py-4 font-bold">Current Role</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2e8]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#8a8a7a] text-xs font-bold uppercase tracking-wider">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, i) => {
                    const isSelf = user.id === currentUserId;
                    
                    return (
                      <tr key={user.id} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f9faf6]", "hover:bg-[#f0f2e8] transition-colors")}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#3d5a2e]/10 flex items-center justify-center font-bold text-xs text-[#3d5a2e] uppercase border border-[#3d5a2e]/20">
                              {user.name ? user.name.charAt(0) : "?"}
                            </div>
                            <div>
                              <p className="text-xs font-black text-[#1a2c1a] flex items-center gap-2">
                                {user.name || "No name configured"}
                                {isSelf && (
                                  <Badge className="bg-[#3d5a2e] text-white text-[8px] font-black uppercase tracking-wider py-0 px-1 border-none rounded">
                                    You
                                  </Badge>
                                )}
                              </p>
                              <p className="text-[10px] text-[#8a8a7a] font-bold">ID: {user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-[#1a2c1a]">
                          <div className="space-y-0.5">
                            {user.email && <p>{user.email}</p>}
                            {user.phone && <p className="text-[#8a8a7a] font-bold">{user.phone}</p>}
                            {!user.email && !user.phone && <span className="text-red-500 italic">No credentials</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[10px] text-[#8a8a7a] font-bold uppercase">
                          {new Date(user.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={cn("rounded-full text-[9px] font-black uppercase px-3 py-0.5 border", roleStyles[user.role])}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isSelf ? (
                            <span className="text-[10px] text-[#8a8a7a] font-bold italic pr-3">Cannot edit self</span>
                          ) : (
                            <div className="flex items-center justify-end gap-3">
                              <div className="inline-block w-40 text-left">
                                <Select 
                                  disabled={updatingUserId === user.id || deletingUserId === user.id}
                                  value={user.role} 
                                  onValueChange={(role) => handleRoleChange(user.id, role as any)}
                                >
                                  <SelectTrigger className="h-8 border-[#d4d9b8] bg-white text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">
                                    {updatingUserId === user.id ? (
                                      <span className="flex items-center gap-1">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Saving...
                                      </span>
                                    ) : (
                                      <SelectValue />
                                    )}
                                  </SelectTrigger>
                                  <SelectContent className="border-[#d4d9b8]">
                                    <SelectItem value="CUSTOMER" className="text-xs font-bold uppercase tracking-wider">CUSTOMER</SelectItem>
                                    <SelectItem value="STAFF" className="text-xs font-bold uppercase tracking-wider">STAFF</SelectItem>
                                    <SelectItem value="ADMIN" className="text-xs font-bold uppercase tracking-wider">ADMIN</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-[#A32D2D] hover:bg-[#FCEBEB] rounded-full shrink-0"
                                disabled={updatingUserId === user.id || deletingUserId === user.id}
                                onClick={() => handleDeleteUser(user.id, user.name || "User")}
                              >
                                {deletingUserId === user.id ? (
                                  <Loader2 size={14} className="animate-spin text-[#A32D2D]" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
