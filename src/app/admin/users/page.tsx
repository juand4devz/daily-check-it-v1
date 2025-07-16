// /app/admin/users/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
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
    // Loader2,
    RotateCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { User } from "@/types/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";
type RoleFilter = "all" | "admin" | "user" | "banned";
type LoginTypeFilter = "all" | "email" | "github" | "google";

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
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

    // --- Fetch User Data from API ---
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/users");
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Gagal memuat daftar pengguna.");
            }
            const fetchedUsers: User[] = await response.json();
            setUsers(fetchedUsers);
            toast.success("Daftar pengguna berhasil dimuat.");
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error(error instanceof Error ? error.message : "Gagal memuat pengguna.");
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // --- Filtering and Sorting Logic ---
    const filteredAndSortedUsers = users
        .filter((user) => {
            const matchesSearch =
                user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.location?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                (user.bio?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

            const matchesRole = roleFilter === "all" || user.role === roleFilter;
            const matchesLoginType = loginTypeFilter === "all" || user.loginType === loginTypeFilter;

            return matchesSearch && matchesRole && matchesLoginType;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case "oldest":
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case "name-asc":
                    return a.username.localeCompare(b.username);
                case "name-desc":
                    return b.username.localeCompare(a.username);
                default:
                    return 0;
            }
        });

    const totalPages = Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentUsers = filteredAndSortedUsers.slice(startIndex, endIndex);

    const handleFilterChange = useCallback(() => {
        setCurrentPage(1);
    }, []);

    // --- Action Handlers (Menggunakan Sonner Toast untuk Konfirmasi) ---
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
                throw new Error(errorData.message || "Gagal melakukan aksi.");
            }
            await fetchUsers();
            return { success: true, message: "Aksi berhasil!" };
        } catch (error) {
            console.error("Error updating user:", error);
            return { success: false, message: error instanceof Error ? error.message : "Gagal melakukan aksi." };
        } finally {
            setIsUpdatingUser(false);
        }
    }, [fetchUsers]);

    const handleRoleChangeClick = useCallback((user: User, newRole: "admin" | "user") => {
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
                    const result = await sendUpdateUserRequest(user.id, { role: "banned", isBanned: true });
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
                    const result = await sendUpdateUserRequest(user.id, { role: "user", isBanned: false });
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
            description: `Apakah Anda yakin ingin mereset token harian ${user.username} ke ${user.maxDailyTokens} dan mereset Total Penggunaan mereka ke 0?`,
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
                        await fetchUsers();
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
    }, [fetchUsers]);

    const handleViewUser = useCallback((user: User) => {
        setSelectedUser(user);
        setShowUserDetail(true);
    }, []);

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
                return <div className="h-3 w-3 bg-red-500 rounded-full" />;
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
                <Badge
                    variant="destructive"
                    className="cursor-not-allowed"
                    onClick={() => toast.info(`Pengguna ${user.username} diblokir. Gunakan menu aksi untuk unban.`)}
                >
                    <UserX className="h-3 w-3 mr-1" /> Blocked
                </Badge>
            );
        } else if (user.role === "admin") {
            return (
                <Badge
                    variant="default"
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => handleRoleChangeClick(user, "user")}
                >
                    <Shield className="h-3 w-3 mr-1" /> Admin
                </Badge>
            );
        } else { // user.role === "user"
            return (
                <Badge
                    variant="secondary"
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => handleRoleChangeClick(user, "admin")}
                >
                    <Eye className="h-3 w-3 mr-1" /> User
                </Badge>
            );
        }
    }, [handleRoleChangeClick]);


    if (isLoading) {
        return (
            <div className="mx-2 md:mx-4 py-6 space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Card className="p-4">
                    <Skeleton className="h-10 w-full mb-4" />
                    <Skeleton className="h-12 w-full mb-4" />
                    <div className="space-y-2">
                        {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                    <Skeleton className="h-8 w-full mt-4" />
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-2 md:mx-4 py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Kelola Pengguna</h1>
                    <p className="text-muted-foreground">Kelola pengguna sistem dan atur peran mereka</p>
                </div>
            </div>

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
                                <Select
                                    value={sortBy}
                                    onValueChange={(value: SortOption) => {
                                        setSortBy(value);
                                        handleFilterChange();
                                    }}
                                >
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

                                <Select
                                    value={roleFilter}
                                    onValueChange={(value: RoleFilter) => {
                                        setRoleFilter(value);
                                        handleFilterChange();
                                    }}
                                >
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

                                <Select
                                    value={loginTypeFilter}
                                    onValueChange={(value: LoginTypeFilter) => {
                                        setLoginTypeFilter(value);
                                        handleFilterChange();
                                    }}
                                >
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
                                            <TableCell className="align-top py-2">
                                                {/* Memanggil fungsi untuk badge role dan status */}
                                                {getRoleAndStatusBadge(user)}
                                            </TableCell>
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
                                                                <TooltipTrigger asChild>
                                                                    <Github className="h-3 w-3 text-muted-foreground" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>GitHub: {user.github}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {user.twitter && user.twitter.trim() !== "" && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Twitter className="h-3 w-3 text-muted-foreground" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Twitter: {user.twitter}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {user.linkedin && user.linkedin.trim() !== "" && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Linkedin className="h-3 w-3 text-muted-foreground" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>LinkedIn: {user.linkedin}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {user.instagram && user.instagram.trim() !== "" && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Instagram className="h-3 w-3 text-muted-foreground" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Instagram: {user.instagram}</p>
                                                                </TooltipContent>
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
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Lihat Detail
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {/* Menu Ban/Unban */}
                                                        {user.role !== "banned" ? (
                                                            <DropdownMenuItem
                                                                onClick={() => handleBanUserClick(user)}
                                                                className="text-orange-500 focus:text-orange-500"
                                                                disabled={isUpdatingUser}
                                                            >
                                                                <UserX className="mr-2 h-4 w-4" />
                                                                Ban User
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                onClick={() => handleUnbanUserClick(user)}
                                                                className="text-green-500 focus:text-green-500"
                                                                disabled={isUpdatingUser}
                                                            >
                                                                <UserCheck className="mr-2 h-4 w-4" />
                                                                Unban User
                                                            </DropdownMenuItem>
                                                        )}
                                                        {/* Menu Reset Token */}
                                                        <DropdownMenuItem
                                                            onClick={() => handleResetTokensClick(user)}
                                                            disabled={isUpdatingUser}
                                                        >
                                                            <RotateCw className="mr-2 h-4 w-4" />
                                                            Reset Token Harian
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {/* Menu Hapus Permanen */}
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteUserClick(user)}
                                                            className="text-destructive focus:text-destructive"
                                                            disabled={isUpdatingUser}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Hapus Permanen
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
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setCurrentPage(page);
                                                        }}
                                                        isActive={currentPage === page}
                                                        className="cursor-pointer"
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                                            return (
                                                <PaginationItem key={page}>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
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

            {/* User Detail Dialog (Tidak Berubah) */}
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
                                    style={{
                                        backgroundImage: `url(${selectedUser.banner || ''})`,
                                    }}
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
                                        <Mail className="h-4 w-4" />
                                        {selectedUser.email}
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant={selectedUser.role === "admin" ? "default" : "secondary"}>
                                            {selectedUser.role === "admin" ? (
                                                <>
                                                    <Shield className="h-3 w-3 mr-1" /> Admin
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="h-3 w-3 mr-1" /> User
                                                </>
                                            )}
                                        </Badge>
                                        {getLoginTypeBadge(selectedUser.loginType)}
                                        {selectedUser.role === "banned" && <Badge variant="destructive">Blocked</Badge>} {/* Tampilkan badge Blocked di sini */}
                                    </div>
                                    {selectedUser.bio && selectedUser.bio.trim() !== "" && <p className="mt-2 text-sm">{selectedUser.bio}</p>}
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Informasi Dasar</CardTitle>
                                        </CardHeader>
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
                                        <CardHeader>
                                            <CardTitle className="text-lg">Media Sosial</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {selectedUser.github && selectedUser.github.trim() !== "" && (
                                                <div className="flex items-center gap-3">
                                                    <Github className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">GitHub</p>
                                                        <a
                                                            href={`https://github.com/${selectedUser.github}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:underline"
                                                        >
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
                                                        <a
                                                            href={`https://twitter.com/${selectedUser.twitter}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:underline"
                                                        >
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
                                                        <a
                                                            href={`https://linkedin.com/in/${selectedUser.linkedin}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:underline"
                                                        >
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
                                                        <a
                                                            href={`https://instagram.com/${selectedUser.instagram}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:underline"
                                                        >
                                                            @{selectedUser.instagram}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            {!selectedUser.github &&
                                                !selectedUser.twitter &&
                                                !selectedUser.linkedin &&
                                                !selectedUser.instagram && (
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