"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useAuth, UserRole } from "@/components/auth-provider";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMemoFirebase, useFirestore, useCollection } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Student } from "../students/student-table";
import {
  Users,
  CreditCard,
  UserPlus,
  ClipboardList,
  CalendarCheck,
  GraduationCap,
  User as UserIcon,
  Receipt,
  Video,
  Search,
  BookOpen,
  Image as ImageIcon,
  ChevronRight,
  Building2,
  Clock,
  CheckCircle2,
  ShieldCheck,
  LucideIcon,
} from "lucide-react";

interface QuickActionItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  roles: UserRole[];
  iconBg: string;
}

const allQuickActions: QuickActionItem[] = [
  // Super Admin priority actions
  {
    href: "/admin/transactions",
    label: "Confirm Payments",
    description: "Review, approve, or reject student fee payment slips.",
    icon: CreditCard,
    roles: ["super_admin"],
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    href: "/bursar",
    label: "Upload & Tie Receipts",
    description: "Search students in database and upload fee payment receipts.",
    icon: Receipt,
    roles: ["burser", "super_admin"],
    iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  {
    href: "/manage-students",
    label: "Manage Student Records",
    description: "View and filter student profiles, class rosters, and academic files.",
    icon: ClipboardList,
    roles: ["super_admin", "branch_admin", "teacher", "burser"],
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    href: "/search-students",
    label: "Search Students",
    description: "Lookup student records by admission number, name, or branch.",
    icon: Search,
    roles: ["super_admin", "branch_admin", "burser"],
    iconBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  {
    href: "/students/add",
    label: "Enroll New Student",
    description: "Register a new student and generate parent login credentials.",
    icon: UserPlus,
    roles: ["teacher", "branch_admin", "super_admin"],
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  {
    href: "/users/invite?role=teacher",
    label: "Register Teacher Under Class",
    description: "Assign a teacher to a specific class for student registration and scores.",
    icon: GraduationCap,
    roles: ["branch_admin", "super_admin"],
    iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  {
    href: "/users",
    label: "Manage Staff & Users",
    description: "Oversee staff accounts, permissions, and branch assignments.",
    icon: Users,
    roles: ["super_admin", "branch_admin"],
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    href: "/users/invite",
    label: "Invite New User",
    description: "Create and invite new teachers, bursars, or administrators.",
    icon: UserPlus,
    roles: ["super_admin", "branch_admin"],
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    href: "/attendance",
    label: "Take Attendance",
    description: "Mark daily attendance using student QR scanner or class roll.",
    icon: CalendarCheck,
    roles: ["teacher", "branch_admin", "super_admin"],
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    href: "/results",
    label: "Enter Results",
    description: "Input student test scores and upload terminal report cards.",
    icon: GraduationCap,
    roles: ["teacher", "branch_admin", "super_admin"],
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    href: "/daarul-iftaa-admin",
    label: "Daarul Iftaa Media",
    description: "Upload scholarly lectures, audio, and Islamic guidance videos.",
    icon: Video,
    roles: ["daarul_iftaa", "super_admin"],
    iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    href: "/daarul-iftaa",
    label: "Public Iftaa Portal",
    description: "View the public Fatwa repository and scholarly video library.",
    icon: BookOpen,
    roles: ["daarul_iftaa"],
    iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    href: "/gallery/upload",
    label: "Upload to Gallery",
    description: "Publish photo albums for graduation, seminars, and academy life.",
    icon: ImageIcon,
    roles: ["super_admin", "branch_admin", "daarul_iftaa"],
    iconBg: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
  {
    href: "/transactions",
    label: "Payment History",
    description: "Check fee payment receipts and download confirmed statements.",
    icon: CreditCard,
    roles: ["parent"],
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    href: "/profile",
    label: "My Profile",
    description: "View and update your personal credentials and contact settings.",
    icon: UserIcon,
    roles: ["teacher", "burser", "daarul_iftaa", "branch_admin", "parent"],
    iconBg: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
];

function getRoleBadge(role?: string) {
  switch (role) {
    case "super_admin":
      return {
        label: "Super Admin",
        className: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
      };
    case "branch_admin":
      return {
        label: "Branch Admin",
        className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      };
    case "burser":
      return {
        label: "Bursar",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      };
    case "daarul_iftaa":
      return {
        label: "Daarul Iftaa",
        className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
      };
    case "teacher":
      return {
        label: "Teacher",
        className: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
      };
    case "parent":
      return {
        label: "Parent",
        className: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
      };
    default:
      return {
        label: role?.replace("_", " ") || "User",
        className: "bg-muted text-muted-foreground border-border",
      };
  }
}

function ParentDashboard({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const firestore = useFirestore();
  const childrenQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, "students"), where("parentUserId", "==", user.uid));
  }, [firestore, user?.uid]);

  const { data: children, isLoading } = useCollection<Student>(childrenQuery);

  return (
    <Card className="shadow-xs border-border">
      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold">My Enrolled Children</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Track attendance, reports, and academic records for your children.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {children?.length || 0} {children?.length === 1 ? "Child" : "Children"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-0">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        )}
        {!isLoading && children?.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
            No children are currently linked to your parent account. Please contact your academy branch administrator.
          </div>
        )}

        {children && children.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {children.map((child) => (
              <div
                key={child.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card/60 hover:bg-accent/30 transition-colors"
              >
                <Avatar className="h-11 w-11 shrink-0 border">
                  <AvatarImage src={child.photoUrl} alt={child.fullName} />
                  <AvatarFallback className="text-xs font-bold">{child.fullName?.charAt(0) || "S"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{child.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {child.class} • Adm: {child.admissionNo}
                  </p>
                  {child.branchId && (
                    <span className="inline-block mt-0.5 text-[11px] font-medium text-primary">
                      {child.branchId}
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-1 shrink-0">
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2">
                    <Link href={`/children/${child.id}/attendance`}>
                      <CalendarCheck className="mr-1 h-3.5 w-3.5" />
                      Attendance
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary" className="h-7 text-xs px-2">
                    <Link href={`/children/${child.id}/results`}>
                      <GraduationCap className="mr-1 h-3.5 w-3.5" />
                      Results
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const firestore = useFirestore();

  // Query Students based on role
  const studentsQuery = useMemoFirebase(() => {
    if (!user || !user.uid || !firestore) return null;
    if (user.role === "super_admin") {
      return collection(firestore, "students");
    }
    if ((user.role === "branch_admin" || user.role === "teacher" || user.role === "burser") && user.branchId) {
      return query(collection(firestore, "students"), where("branchId", "==", user.branchId));
    }
    return null;
  }, [user, firestore]);

  const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);

  // Query Receipts for Super Admin and Bursar
  const receiptsQuery = useMemoFirebase(() => {
    if (!user || !user.uid || !firestore) return null;
    if (user.role === "super_admin" || user.role === "burser") {
      return collection(firestore, "receipts");
    }
    return null;
  }, [user, firestore]);

  const { data: receipts, isLoading: receiptsLoading } = useCollection<{ id: string; status: string; branchId?: string }>(receiptsQuery);

  // Query Users for Super Admin and Branch Admin
  const usersQuery = useMemoFirebase(() => {
    if (!user || !user.uid || !firestore) return null;
    if (user.role === "super_admin") {
      return collection(firestore, "users");
    }
    if (user.role === "branch_admin" && user.branchId) {
      return query(collection(firestore, "users"), where("branchId", "==", user.branchId));
    }
    return null;
  }, [user, firestore]);

  const { data: users, isLoading: usersLoading } = useCollection<{ id: string; role?: string; status?: string }>(usersQuery);

  // Query Media for Daarul Iftaa
  const mediaQuery = useMemoFirebase(() => {
    if (!user || !user.uid || !firestore) return null;
    if (user.role === "daarul_iftaa" || user.role === "super_admin") {
      return collection(firestore, "daarul_iftaa_media");
    }
    return null;
  }, [user, firestore]);

  const { data: media, isLoading: mediaLoading } = useCollection<{ id: string; type?: string }>(mediaQuery);

  // Filter actions based on role
  const availableActions = useMemo(() => {
    if (!user?.role) return [];
    return allQuickActions.filter((action) => action.roles.includes(user.role as UserRole));
  }, [user?.role]);

  if (!user) return null;

  const roleBadge = getRoleBadge(user.role);
  const pendingReceiptsCount = receipts?.filter((r) => r.status === "pending").length ?? 0;
  const approvedReceiptsCount = receipts?.filter((r) => r.status === "approved").length ?? 0;
  const videoMediaCount = media?.filter((m) => m.type === "video").length ?? 0;
  const photoMediaCount = media?.filter((m) => m.type === "picture").length ?? 0;

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl mx-auto">
      {/* Welcome Banner - Compact and Scaled */}
      <div className="rounded-xl border bg-card/60 backdrop-blur-xs p-3.5 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold font-headline text-foreground truncate">
                Welcome, {user?.fullName || user?.email?.split("@")[0] || "User"}!
              </h1>
              <Badge variant="outline" className={`text-xs px-2 py-0.5 font-semibold ${roleBadge.className}`}>
                {roleBadge.label}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Al-Huffaazh Central Management Portal • {user?.branchId ? `Branch: ${user.branchId}` : "All Branches"}
            </p>
          </div>

          {user.branchId && (
            <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span>Campus: {user.branchId}</span>
            </div>
          )}
        </div>
      </div>

      {/* Role-Specific Metric Stat Cards - 2 to 4 responsive columns */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Metric 1: Role or Main Metric */}
        <Card className="p-3 sm:p-4 shadow-xs border-border">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-medium text-muted-foreground">Portal Role</span>
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-base sm:text-xl font-bold capitalize truncate">
            {roleBadge.label}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {user.role === "super_admin" ? "Full administrative access" : "Role-based privileges"}
          </p>
        </Card>

        {/* Metric 2: Students or Media */}
        {user.role === "daarul_iftaa" ? (
          <Card className="p-3 sm:p-4 shadow-xs border-border">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-muted-foreground">Video Lectures</span>
              <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Video className="h-4 w-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold">
              {mediaLoading ? "..." : videoMediaCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Published scholarly recordings</p>
          </Card>
        ) : (
          <Card className="p-3 sm:p-4 shadow-xs border-border">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-muted-foreground">
                {user.role === "super_admin" ? "Total Students" : "Branch Students"}
              </span>
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold">
              {studentsLoading ? "..." : students?.length || 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {user.role === "super_admin" ? "Across all 14 branches" : user.branchId ? `In ${user.branchId}` : "Enrolled students"}
            </p>
          </Card>
        )}

        {/* Metric 3: Role-specific secondary stat */}
        {user.role === "super_admin" && (
          <Card className="p-3 sm:p-4 shadow-xs border-border">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-muted-foreground">Pending Receipts</span>
              <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold">
              {receiptsLoading ? "..." : pendingReceiptsCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {pendingReceiptsCount > 0 ? "Awaiting your confirmation" : "All receipts verified"}
            </p>
          </Card>
        )}

        {user.role === "branch_admin" && (
          <Card className="p-3 sm:p-4 shadow-xs border-border">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-muted-foreground">Branch Staff</span>
              <div className="p-1.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold">
              {usersLoading ? "..." : users?.length || 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Teachers & bursars assigned</p>
          </Card>
        )}

        {user.role === "burser" && (
          <Card className="p-3 sm:p-4 shadow-xs border-border">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-muted-foreground">Pending Receipts</span>
              <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold">
              {receiptsLoading ? "..." : pendingReceiptsCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Receipts tied & pending</p>
          </Card>
        )}

        {user.role === "teacher" && (
          <Card className="p-3 sm:p-4 shadow-xs border-border">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-muted-foreground">Daily Roll</span>
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CalendarCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
              Active
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Ready for attendance check</p>
          </Card>
        )}

        {user.role === "daarul_iftaa" && (
          <Card className="p-3 sm:p-4 shadow-xs border-border">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-muted-foreground">Photo Media</span>
              <div className="p-1.5 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400">
                <ImageIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold">
              {mediaLoading ? "..." : photoMediaCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Gallery albums uploaded</p>
          </Card>
        )}

        {user.role === "parent" && (
          <Card className="p-3 sm:p-4 shadow-xs border-border">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-muted-foreground">Portal Status</span>
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
              Connected
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Real-time academic alerts</p>
          </Card>
        )}

        {/* Metric 4: System / Campus Metric */}
        {user.role === "super_admin" && (
          <Card className="p-3 sm:p-4 shadow-xs border-border">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-muted-foreground">Total Staff</span>
              <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold">
              {usersLoading ? "..." : users?.length || 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">System teachers & admins</p>
          </Card>
        )}

        {user.role === "branch_admin" && (
          <Card className="p-3 sm:p-4 shadow-xs border-border">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-muted-foreground">Branch Code</span>
              <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold truncate">
              {user.branchId || "Assigned"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Branch campus jurisdiction</p>
          </Card>
        )}

        {user.role === "burser" && (
          <Card className="p-3 sm:p-4 shadow-xs border-border">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-muted-foreground">Confirmed Receipts</span>
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold">
              {receiptsLoading ? "..." : approvedReceiptsCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Approved school fee payments</p>
          </Card>
        )}

        {user.role === "teacher" && (
          <Card className="p-3 sm:p-4 shadow-xs border-border">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-muted-foreground">Campus</span>
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold truncate">
              {user.branchId || "Assigned"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Academic teaching station</p>
          </Card>
        )}

        {user.role === "daarul_iftaa" && (
          <Card className="p-3 sm:p-4 shadow-xs border-border">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-muted-foreground">Public Status</span>
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
              Live
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Public media portal active</p>
          </Card>
        )}

        {user.role === "parent" && (
          <Card className="p-3 sm:p-4 shadow-xs border-border">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-muted-foreground">Fee Receipts</span>
              <div className="p-1.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold">
              Available
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">View status in Transactions</p>
          </Card>
        )}
      </div>

      {/* Special Parent Children Overview or Role Quick Actions */}
      {user.role === "parent" ? (
        <ParentDashboard user={user} />
      ) : null}

      {/* Quick Actions Grid - Compact, responsive, no whitespace-nowrap overflow */}
      <Card className="shadow-xs border-border">
        <CardHeader className="p-4 sm:p-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">Quick Actions</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Operational tools and shortcuts tailored for your role.
              </CardDescription>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {availableActions.length} Actions
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0">
          {availableActions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {availableActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group relative flex items-start gap-3 rounded-lg border bg-card p-3 sm:p-3.5 text-card-foreground shadow-xs transition-all duration-200 hover:shadow-xs hover:border-primary/50 hover:bg-accent/40 active:scale-[0.99] min-w-0"
                >
                  <div className={`p-2 rounded-md shrink-0 ${action.iconBg} transition-transform group-hover:scale-105`}>
                    <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {action.label}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                      {action.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No specific actions available for your role at the moment.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
