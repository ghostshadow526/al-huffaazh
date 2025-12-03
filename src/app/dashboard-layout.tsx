
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, UserRole } from '@/components/auth-provider';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import {
  Home,
  Users,
  CreditCard,
  UserPlus,
  LogOut,
  ShieldCheck,
  LucideIcon,
  ClipboardList,
  CalendarCheck,
  User as UserProfileIcon,
  GraduationCap,
  Bell,
  ArrowLeftRight,
  Search,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth as useFirebaseAuth } from '@/firebase';

function getInitials(name?: string | null) {
  if (!name) return "U";
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

const navItems: { href: string; label: string; icon: LucideIcon; roles: UserRole[] }[] = [
    { href: "/dashboard", label: "Dashboard", icon: Home, roles: ['super_admin', 'branch_admin', 'teacher', 'parent'] },
    { href: "/profile", label: "My Profile", icon: UserProfileIcon, roles: ['super_admin', 'branch_admin', 'teacher', 'parent'] },
    { href: "/manage-students", label: "Manage Students", icon: ClipboardList, roles: ['super_admin', 'branch_admin', 'teacher'] },
    { href: "/search-students", label: "Search Students", icon: Search, roles: ['super_admin', 'branch_admin'] },
    { href: "/attendance", label: "Attendance", icon: CalendarCheck, roles: ['teacher', 'branch_admin', 'super_admin'] },
    { href: "/gallery/upload", label: "Gallery", icon: ImageIcon, roles: ['super_admin', 'branch_admin'] },
    { href: "/transactions", label: "Transactions", icon: ArrowLeftRight, roles: ['parent'] },
    { href: "/admin/transactions", label: "All Transactions", icon: CreditCard, roles: ['super_admin', 'branch_admin'] },
    { href: "/users", label: "Manage Users", icon: Users, roles: ['super_admin', 'branch_admin'] },
];

export default function DashboardLayout({ user, children }: { user: User; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useFirebaseAuth();

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
    }
    router.push('/');
  };
  
  const accessibleNavItems = navItems.filter(item => user.role && item.roles.includes(user.role));

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-sidebar-border">
        <SidebarHeader>
          <div className="flex items-center gap-2" data-testid="sidebar-header">
             <Logo className="w-8 h-8 text-sidebar-primary group-data-[state=collapsed]:w-10 group-data-[state=collapsed]:h-10 transition-all" />
            <span className="text-lg font-semibold text-sidebar-foreground group-data-[state=collapsed]:hidden">Al-Huffaazh</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {accessibleNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))} tooltip={{children: item.label}}>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarSeparator />
          <SidebarMenu>
            <SidebarMenuItem>
                <div className="flex items-center gap-3 p-2 group-data-[state=collapsed]:p-0 group-data-[state=collapsed]:justify-center">
                    <Avatar className="group-data-[state=collapsed]:w-8 group-data-[state=collapsed]:h-8">
                        <AvatarImage src={user.photoURL || null} alt={user.fullName || 'User'}/>
                        <AvatarFallback>{getInitials(user.fullName || user.email)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-sm group-data-[state=collapsed]:hidden">
                        <span className="font-semibold text-sidebar-foreground">{user.fullName || user.email}</span>
                        <span className="text-sidebar-foreground/70 capitalize">{user.role?.replace('_', ' ')}</span>
                    </div>
                </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip={{children: "Logout"}}>
                <LogOut />
                <span className="group-data-[state=collapsed]:hidden">Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
          <SidebarTrigger className="md:hidden"/>
          <div className="w-full flex-1">
             <h1 className="text-xl font-semibold capitalize">{pathname.split('/').pop()?.replace('-', ' ')}</h1>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
