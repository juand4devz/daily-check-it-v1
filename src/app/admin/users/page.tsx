"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
    Search,
    MoreHorizontal,
    UserCheck,
    UserX,
    Trash2,
    Shield,
    Eye,
    MapPin,
    Github,
    Twitter,
    Linkedin,
    Instagram,
    Calendar,
    Mail,
    Filter,
    SortAsc,
    Key,
    RotateCw,
    Users,
    Activity,
} from "lucide-react";
import UserPageSkeleton from "./loading";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Fuse from "fuse.js";
import { collection, onSnapshot, query, Timestamp } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/firebase-client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { User } from "@/types/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

// Definisi Tipe dan Konstanta
// ----------------------------
type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";
type RoleFilter = "all" | "admin" | "user" | "banned";
type LoginTypeFilter = "all" | "email" | "github" | "google";

const ITEMS_PER_PAGE = 10;
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

// Helper function to get week number (diperbaiki agar lebih andal)
const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// ----------------------------
// Komponen Utama
// ----------------------------
export default function UsersPage() {
    // --- State Management ---
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showUserDetail, setShowUserDetail] = useState(false);
    const [isUpdatingUser, setIsUpdatingUser] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
    const [loginTypeFilter, setLoginTypeFilter] = useState<LoginTypeFilter>("all");
    const [statsMonth, setStatsMonth] = useState(new Date().getMonth().toString());
    const [statsYear, setStatsYear] = useState(new Date().getFullYear().toString());

    // --- Realtime Data Fetching with onSnapshot (diperbaiki) ---
    useEffect(() => {
        const usersCollectionRef = collection(clientDb, "users");
        const q = query(usersCollectionRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedUsers: User[] = snapshot.docs.map(doc => {
                const data = doc.data();

                // Perbaikan: Cek apakah data adalah Timestamp sebelum memanggil .toDate()
                const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt;
                const lastLogin = data.lastLogin instanceof Timestamp ? data.lastLogin.toDate().toISOString() : data.lastLogin || new Date().toISOString();

                return {
                    id: doc.id,
                    ...data,
                    createdAt,
                    lastLogin,
                } as User;
            });
            setUsers(fetchedUsers);
            setIsLoading(false);
            toast.success("Daftar pengguna diperbarui secara real-time.");
        }, (error) => {
            console.error("Error fetching users via snapshot:", error);
            toast.error("Gagal memuat pengguna secara real-time.");
            setIsLoading(false);
        });

        // Cleanup function for unsubscribe
        return () => unsubscribe();
    }, []);

    // --- Fuse.js for Client-Side Search and Filtering ---
    const fuse = useMemo(() => {
        const options = {
            keys: ['username', 'email', 'location', 'bio'],
            threshold: 0.3,
        };
        return new Fuse(users, options);
    }, [users]);

    // --- Filter, Sort, and Paginate Logic ---
    const filteredAndSortedUsers = useMemo(() => {
        let result = searchTerm ? fuse.search(searchTerm).map(item => item.item) : users;

        if (roleFilter !== "all") {
            result = result.filter(user => user.role === roleFilter);
        }
        if (loginTypeFilter !== "all") {
            result = result.filter(user => user.loginType === loginTypeFilter);
        }

        return result.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            const nameA = a.username.toLowerCase();
            const nameB = b.username.toLowerCase();

            switch (sortBy) {
                case "newest":
                    return dateB - dateA;
                case "oldest":
                    return dateA - dateB;
                case "name-asc":
                    return nameA.localeCompare(nameB);
                case "name-desc":
                    return nameB.localeCompare(nameA);
                default:
                    return 0;
            }
        });
    }, [users, searchTerm, roleFilter, loginTypeFilter, sortBy, fuse]);

    const totalPages = Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentUsers = filteredAndSortedUsers.slice(startIndex, endIndex);

    const handleFilterChange = useCallback(() => {
        setCurrentPage(1);
    }, []);

    // --- Statistik & Chart Logic ---
    const registrationChartData = useMemo(() => {
        const selectedDate = new Date(parseInt(statsYear), parseInt(statsMonth), 1);
        const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

        const weeklyCounts: Record<string, number> = {};
        const daysInMonth = endOfMonth.getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i);
            const week = getWeekNumber(date);
            const weekKey = `Minggu ${week}`;
            if (!weeklyCounts.hasOwnProperty(weekKey)) {
                weeklyCounts[weekKey] = 0;
            }
        }

        users.forEach(user => {
            const createdAt = new Date(user.createdAt);
            if (createdAt >= startOfMonth && createdAt <= endOfMonth) {
                const week = getWeekNumber(createdAt);
                const weekKey = `Minggu ${week}`;
                if (weeklyCounts.hasOwnProperty(weekKey)) {
                    weeklyCounts[weekKey]++;
                }
            }
        });

        return Object.entries(weeklyCounts)
            .sort(([weekA], [weekB]) => {
                const numA = parseInt(weekA.replace('Minggu ', ''));
                const numB = parseInt(weekB.replace('Minggu ', ''));
                return numA - numB;
            })
            .map(([name, count]) => ({
                name,
                "Jumlah Pengguna": count
            }));
    }, [users, statsMonth, statsYear]);

    const loginTypeChartData = useMemo(() => {
        const counts = users.reduce((acc, user) => {
            acc[user.loginType] = (acc[user.loginType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({
            name, value
        }));
    }, [users]);

    const yearsOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear; i >= 2020; i--) {
            years.push({ label: i.toString(), value: i.toString() });
        }
        return years;
    }, []);

    const monthsOptions = useMemo(() => {
        return [
            { label: "Januari", value: "0" }, { label: "Februari", value: "1" },
            { label: "Maret", value: "2" }, { label: "April", value: "3" },
            { label: "Mei", value: "4" }, { label: "Juni", value: "5" },
            { label: "Juli", value: "6" }, { label: "Agustus", value: "7" },
            { label: "September", value: "8" }, { label: "Oktober", value: "9" },
            { label: "November", value: "10" }, { label: "Desember", value: "11" },
        ];
    }, []);

    const stats = useMemo(() => {
        const total = users.length;
        const totalAdmins = users.filter(u => u.role === 'admin').length;
        const totalBanned = users.filter(u => u.role === 'banned').length;
        const totalUsers = users.filter(u => u.role === 'user').length;
        const totalEmail = users.filter(u => u.loginType === 'email').length;
        const totalGithub = users.filter(u => u.loginType === 'github').length;
        const totalGoogle = users.filter(u => u.loginType === 'google').length;

        const totalDailyTokens = users.reduce((sum, u) => sum + u.dailyTokens, 0);
        const avgDailyTokens = total > 0 ? totalDailyTokens / total : 0;

        return {
            total,
            totalAdmins,
            totalBanned,
            totalUsers,
            totalEmail,
            totalGithub,
            totalGoogle,
            avgDailyTokens,
        };
    }, [users]);

    // --- Handler Functions ---
    const sendUpdateUserRequest = useCallback(async (userId: string, data: Partial<User> & { resetTokens?: boolean }) => {
        setIsUpdatingUser(true);
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Gagal melakukan aksi.");
            }
            return { success: true, message: "Aksi berhasil!" };
        } catch (error) {
            console.error("Error updating user:", error);
            return { success: false, message: error instanceof Error ? error.message : "Gagal melakukan aksi." };
        } finally {
            setIsUpdatingUser(false);
        }
    }, []);

    const handleRoleChangeClick = useCallback(async (user: User, newRole: "admin" | "user") => {
        toast("Konfirmasi Perubahan Role", {
            description: `Apakah Anda yakin ingin mengubah role ${user.username} menjadi ${newRole === "admin" ? "Admin" : "User"}?`,
            action: {
                label: "Ubah",
                onClick: async () => {
                    const result = await sendUpdateUserRequest(user.id, { role: newRole });
                    if (result.success) {
                        toast.success(`Role ${user.username} berhasil diubah menjadi ${newRole === "admin" ? "Admin" : "User"}.`);
                    } else {
                        toast.error(result.message);
                    }
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => toast.dismiss(),
            },
        });
    }, [sendUpdateUserRequest]);

    const handleBanUserClick = useCallback((user: User) => {
        toast("Konfirmasi Blokir Pengguna", {
            description: `Apakah Anda yakin ingin memblokir (ban) pengguna ${user.username}? Mereka tidak akan bisa lagi mengakses sistem.`,
            action: {
                label: "Blokir",
                onClick: async () => {
                    const result = await sendUpdateUserRequest(user.id, { role: "banned" });
                    if (result.success) {
                        toast.success(`Pengguna ${user.username} berhasil diblokir.`);
                    } else {
                        toast.error(result.message);
                    }
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => toast.dismiss(),
            },
        });
    }, [sendUpdateUserRequest]);

    const handleUnbanUserClick = useCallback((user: User) => {
        toast("Konfirmasi Aktifkan Pengguna", {
            description: `Apakah Anda yakin ingin mengaktifkan kembali (unban) pengguna ${user.username}? Mereka akan bisa login kembali.`,
            action: {
                label: "Aktifkan",
                onClick: async () => {
                    const result = await sendUpdateUserRequest(user.id, { role: "user" });
                    if (result.success) {
                        toast.success(`Pengguna ${user.username} berhasil diaktifkan kembali.`);
                    } else {
                        toast.error(result.message);
                    }
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => toast.dismiss(),
            },
        });
    }, [sendUpdateUserRequest]);

    const handleResetTokensClick = useCallback((user: User) => {
        toast("Konfirmasi Reset Token", {
            description: `Apakah Anda yakin ingin mereset token harian ${user.username}?`,
            action: {
                label: "Reset",
                onClick: async () => {
                    const result = await sendUpdateUserRequest(user.id, { resetTokens: true });
                    if (result.success) {
                        toast.success(`Token harian ${user.username} berhasil direset.`);
                    } else {
                        toast.error(result.message);
                    }
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => toast.dismiss(),
            },
        });
    }, [sendUpdateUserRequest]);

    const handleDeleteUserClick = useCallback((user: User) => {
        toast("Konfirmasi Hapus Permanen", {
            description: `Ini akan menghapus pengguna ${user.username} secara PERMANEN. Tindakan ini tidak dapat dibatalkan. Lanjutkan?`,
            action: {
                label: "Hapus",
                onClick: async () => {
                    setIsUpdatingUser(true);
                    try {
                        const response = await fetch(`/api/users/${user.id}`, {
                            method: 'DELETE',
                        });
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.message || "Gagal menghapus pengguna secara permanen.");
                        }
                        toast.success(`Pengguna ${user.username} berhasil dihapus secara permanen.`);
                    } catch (error) {
                        console.error("Error deleting user:", error);
                        toast.error(error instanceof Error ? error.message : "Gagal menghapus pengguna secara permanen.");
                    } finally {
                        setIsUpdatingUser(false);
                    }
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => toast.dismiss(),
            },
        });
    }, []);

    const handleViewUser = useCallback((user: User) => {
        setSelectedUser(user);
        setShowUserDetail(true);
    }, []);

    // --- Helper Functions for Rendering ---
    const formatDate = useCallback((dateString: string): string => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }, []);

    const formatDateTime = useCallback((dateString: string): string => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }, []);

    const getSocialMediaCount = useCallback((user: User): number => {
        const socialMedia = [user.github, user.twitter, user.linkedin, user.instagram].filter(Boolean);
        return socialMedia.filter(s => s && s.trim() !== "").length;
    }, []);

    const getLoginTypeIcon = useCallback((loginType: string) => {
        switch (loginType) {
            case "github":
                return <Github className="h-3 w-3" />;
            case "google":
                return <div className="h-3 w-3 rounded-full flex items-center justify-center text-xs text-white bg-red-500">G</div>;
            case "email":
            default:
                return <Mail className="h-3 w-3" />;
        }
    }, []);

    const getLoginTypeBadge = useCallback((loginType: string) => {
        const variants = {
            email: "default",
            github: "secondary",
            google: "outline",
        } as const;

        return (
            <Badge variant={variants[loginType as keyof typeof variants] || "default"} className="text-xs">
                {getLoginTypeIcon(loginType)}
                <span className="ml-1 capitalize">{loginType}</span>
            </Badge>
        );
    }, [getLoginTypeIcon]);

    const getRoleAndStatusBadge = useCallback((user: User) => {
        if (user.role === "banned") {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="destructive" className="cursor-not-allowed">
                                <UserX className="h-3 w-3 mr-1" /> Blocked
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Pengguna diblokir. Gunakan menu aksi untuk unban.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        } else if (user.role === "admin") {
            return (
                <Badge variant="default" className="cursor-pointer hover:opacity-80" onClick={() => handleRoleChangeClick(user, "user")}>
                    <Shield className="h-3 w-3 mr-1" /> Admin
                </Badge>
            );
        } else { // user.role === "user"
            return (
                <Badge variant="secondary" className="cursor-pointer hover:opacity-80" onClick={() => handleRoleChangeClick(user, "admin")}>
                    <Eye className="h-3 w-3 mr-1" /> User
                </Badge>
            );
        }
    }, [handleRoleChangeClick]);


    // --- Render Component ---
    if (isLoading) {
        return <UserPageSkeleton />;
    }

    return (
        <div className="mx-2 md:mx-4 py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Kelola Pengguna</h1>
                    <p className="text-muted-foreground">Kelola pengguna sistem dan atur peran mereka.</p>
                </div>
            </div>
            <Tabs defaultValue="statistics" className="w-full">
                <TabsList className="w-full md:w-fit">
                    <TabsTrigger value="statistics">Statistik</TabsTrigger>
                    <TabsTrigger value="users">Data Pengguna</TabsTrigger>
                </TabsList>
                <TabsContent value="statistics" className="mt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Pengguna</p>
                                        <p className="text-2xl font-bold">{stats.total}</p>
                                    </div>
                                    <Users className="h-8 w-8 text-blue-600" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Administrator</p>
                                        <p className="text-2xl font-bold">{stats.totalAdmins}</p>
                                    </div>
                                    <Shield className="h-8 w-8 text-green-600" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Pengguna Terblokir</p>
                                        <p className="text-2xl font-bold text-red-600">{stats.totalBanned}</p>
                                    </div>
                                    <UserX className="h-8 w-8 text-red-600" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Rata-rata Token Harian</p>
                                        <p className="text-2xl font-bold">{stats.avgDailyTokens.toFixed(1)}</p>
                                    </div>
                                    <Activity className="h-8 w-8 text-purple-600" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        <Card>
                            <CardHeader className="flex justify-between items-center space-y-0">
                                <CardTitle>Pengguna Terdaftar Mingguan</CardTitle>
                                <div className="flex gap-2">
                                    <Select value={statsMonth} onValueChange={setStatsMonth}>
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="Bulan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {monthsOptions.map(month => (
                                                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={statsYear} onValueChange={setStatsYear}>
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue placeholder="Tahun" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {yearsOptions.map(year => (
                                                <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={registrationChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis allowDecimals={false} />
                                            <ChartTooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="Jumlah Pengguna" stroke="#8884d8" activeDot={{ r: 8 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Distribusi Tipe Login</CardTitle>
                                <CardDescription>Persentase pengguna berdasarkan metode pendaftaran.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={loginTypeChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%" cy="50%"
                                                outerRadius={100}
                                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                fill="#8884d8"
                                            >
                                                {loginTypeChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <ChartTooltip formatter={(value: number, name: string) => [`${value} pengguna`, name]} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="users" className="space-y-6 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar Pengguna</CardTitle>
                            <CardDescription>Total {filteredAndSortedUsers.length} pengguna terdaftar</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4 mb-6">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari pengguna..."
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                handleFilterChange();
                                            }}
                                            className="pl-8"
                                        />
                                    </div>
                                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                                        <Select value={sortBy} onValueChange={(value: SortOption) => {
                                            setSortBy(value);
                                            handleFilterChange();
                                        }}>
                                            <SelectTrigger className="w-full sm:w-[180px]">
                                                <SortAsc className="h-4 w-4 mr-2" />
                                                <SelectValue placeholder="Urutkan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="newest">Terbaru</SelectItem>
                                                <SelectItem value="oldest">Terlama</SelectItem>
                                                <SelectItem value="name-asc">Nama A-Z</SelectItem>
                                                <SelectItem value="name-desc">Nama Z-A</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={roleFilter} onValueChange={(value: RoleFilter) => {
                                            setRoleFilter(value);
                                            handleFilterChange();
                                        }}>
                                            <SelectTrigger className="w-full sm:w-[120px]">
                                                <Filter className="h-4 w-4 mr-2" />
                                                <SelectValue placeholder="Role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Role</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="user">User</SelectItem>
                                                <SelectItem value="banned">Banned</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={loginTypeFilter} onValueChange={(value: LoginTypeFilter) => {
                                            setLoginTypeFilter(value);
                                            handleFilterChange();
                                        }}>
                                            <SelectTrigger className="w-full sm:w-[140px]">
                                                <Key className="h-4 w-4 mr-2" />
                                                <SelectValue placeholder="Login Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Login</SelectItem>
                                                <SelectItem value="email">Email</SelectItem>
                                                <SelectItem value="github">GitHub</SelectItem>
                                                <SelectItem value="google">Google</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <ScrollArea className="rounded-md border h-[calc(100vh-250px)]">
                                <Table className="min-w-full table-fixed">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[180px]">Pengguna</TableHead>
                                            <TableHead className="min-w-[120px]">Lokasi</TableHead>
                                            <TableHead className="min-w-[100px]">Role</TableHead>
                                            <TableHead className="min-w-[120px]">Login Type</TableHead>
                                            <TableHead className="min-w-[180px]">Token Penggunaan</TableHead>
                                            <TableHead className="min-w-[150px]">Media Sosial</TableHead>
                                            <TableHead className="min-w-[150px]">Bergabung</TableHead>
                                            <TableHead className="w-[70px]">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentUsers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                    Tidak ada pengguna yang ditemukan
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            currentUsers.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="align-top py-2">
                                                        <div className="flex items-center space-x-3">
                                                            <Avatar className="h-10 w-10 shrink-0">
                                                                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                                                                <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <div className="font-medium text-sm">{user.username}</div>
                                                                <div className="text-xs text-muted-foreground break-all">{user.email}</div>
                                                                {user.bio && user.bio.trim() !== "" && (
                                                                    <div className="text-[10px] text-muted-foreground mt-1 max-w-[200px] truncate">
                                                                        {user.bio}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="align-top py-2">
                                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                            <MapPin className="h-3 w-3" />
                                                            <span className="break-words">{user.location || "Tidak diset"}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="align-top py-2">{getRoleAndStatusBadge(user)}</TableCell>
                                                    <TableCell className="align-top py-2">{getLoginTypeBadge(user.loginType)}</TableCell>
                                                    <TableCell className="align-top py-2 text-sm">
                                                        <div className="space-y-0.5">
                                                            <p>Harian: {user.dailyTokens} / {user.maxDailyTokens}</p>
                                                            <p className="text-xs text-muted-foreground">Total: {user.totalUsage}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="align-top py-2">
                                                        <div className="flex items-center gap-1">
                                                            <TooltipProvider>
                                                                {user.github && user.github.trim() !== "" && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild><Github className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                                                        <TooltipContent><p>GitHub: {user.github}</p></TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {user.twitter && user.twitter.trim() !== "" && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild><Twitter className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                                                        <TooltipContent><p>Twitter: {user.twitter}</p></TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {user.linkedin && user.linkedin.trim() !== "" && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild><Linkedin className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                                                        <TooltipContent><p>LinkedIn: {user.linkedin}</p></TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {user.instagram && user.instagram.trim() !== "" && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild><Instagram className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                                                        <TooltipContent><p>Instagram: {user.instagram}</p></TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </TooltipProvider>
                                                            {getSocialMediaCount(user) > 0 && <span className="text-xs text-muted-foreground ml-1">({getSocialMediaCount(user)})</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="align-top py-2 text-sm text-muted-foreground whitespace-nowrap">{formatDate(user.createdAt)}</TableCell>
                                                    <TableCell className="align-top py-2">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdatingUser}>
                                                                    <span className="sr-only">Open menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                                                    <Eye className="mr-2 h-4 w-4" /> Lihat Detail
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                {user.role !== "banned" ? (
                                                                    <DropdownMenuItem onClick={() => handleBanUserClick(user)} disabled={isUpdatingUser}>
                                                                        <UserX className="mr-2 h-4 w-4" /> Ban User
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem onClick={() => handleUnbanUserClick(user)} disabled={isUpdatingUser}>
                                                                        <UserCheck className="mr-2 h-4 w-4" /> Unban User
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem onClick={() => handleResetTokensClick(user)} disabled={isUpdatingUser}>
                                                                    <RotateCw className="mr-2 h-4 w-4" /> Reset Token Harian
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleDeleteUserClick(user)} className="text-destructive focus:text-destructive" disabled={isUpdatingUser}>
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Hapus Permanen
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>

                            {totalPages > 1 && (
                                <div className="mt-6 flex justify-center">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                                                    }}
                                                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                />
                                            </PaginationItem>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                                    return (
                                                        <PaginationItem key={page}>
                                                            <PaginationLink
                                                                href="#"
                                                                onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                                                                isActive={currentPage === page}
                                                                className="cursor-pointer"
                                                            >
                                                                {page}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                    return (
                                                        <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>
                                                    );
                                                }
                                                return null;
                                            })}
                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                                    }}
                                                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}

                            <div className="mt-4 text-sm text-muted-foreground text-center">
                                Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredAndSortedUsers.length)} dari{" "}
                                {filteredAndSortedUsers.length} pengguna
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Pengguna</DialogTitle>
                        <DialogDescription>Informasi lengkap tentang pengguna</DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-6">
                            <div className="relative">
                                <div
                                    className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg bg-cover bg-center"
                                    style={{ backgroundImage: `url(${selectedUser.banner || ''})` }}
                                />
                                <div className="absolute -bottom-8 left-6">
                                    <Avatar className="h-16 w-16 border-4 border-background">
                                        <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} alt={selectedUser.username} />
                                        <AvatarFallback className="text-lg">
                                            {selectedUser.username.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                            <div className="pt-10 space-y-4">
                                <div>
                                    <h3 className="text-xl font-bold">{selectedUser.username}</h3>
                                    <p className="text-muted-foreground flex items-center gap-1">
                                        <Mail className="h-4 w-4" /> {selectedUser.email}
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant={selectedUser.role === "admin" ? "default" : "secondary"}>
                                            {selectedUser.role === "admin" ? (<><Shield className="h-3 w-3 mr-1" /> Admin</>) : (<><Eye className="h-3 w-3 mr-1" /> User</>)}
                                        </Badge>
                                        {getLoginTypeBadge(selectedUser.loginType)}
                                        {selectedUser.role === "banned" && <Badge variant="destructive">Blocked</Badge>}
                                    </div>
                                    {selectedUser.bio && selectedUser.bio.trim() !== "" && <p className="mt-2 text-sm">{selectedUser.bio}</p>}
                                </div>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <Card>
                                        <CardHeader><CardTitle className="text-lg">Informasi Dasar</CardTitle></CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">Bergabung</p>
                                                    <p className="text-sm text-muted-foreground">{formatDate(selectedUser.createdAt)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">Login Terakhir</p>
                                                    <p className="text-sm text-muted-foreground">{formatDateTime(selectedUser.lastLogin)}</p>
                                                </div>
                                            </div>
                                            {selectedUser.location && selectedUser.location.trim() !== "" && (
                                                <div className="flex items-center gap-3">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Lokasi</p>
                                                        <p className="text-sm text-muted-foreground">{selectedUser.location}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader><CardTitle className="text-lg">Media Sosial</CardTitle></CardHeader>
                                        <CardContent className="space-y-3">
                                            {selectedUser.github && selectedUser.github.trim() !== "" && (
                                                <div className="flex items-center gap-3">
                                                    <Github className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">GitHub</p>
                                                        <a href={`https://github.com/${selectedUser.github}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                            @{selectedUser.github}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedUser.twitter && selectedUser.twitter.trim() !== "" && (
                                                <div className="flex items-center gap-3">
                                                    <Twitter className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Twitter</p>
                                                        <a href={`https://twitter.com/${selectedUser.twitter}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                            @{selectedUser.twitter}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedUser.linkedin && selectedUser.linkedin.trim() !== "" && (
                                                <div className="flex items-center gap-3">
                                                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">LinkedIn</p>
                                                        <a href={`https://linkedin.com/in/${selectedUser.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                            {selectedUser.linkedin}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedUser.instagram && selectedUser.instagram.trim() !== "" && (
                                                <div className="flex items-center gap-3">
                                                    <Instagram className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Instagram</p>
                                                        <a href={`https://instagram.com/${selectedUser.instagram}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                            @{selectedUser.instagram}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                            {!selectedUser.github && !selectedUser.twitter && !selectedUser.linkedin && !selectedUser.instagram && (
                                                <p className="text-sm text-muted-foreground">Belum ada tautan media sosial</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}