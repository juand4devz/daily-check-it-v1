"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
    Search,
    MoreHorizontal,
    UserCheck,
    UserX,
    Edit,
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
} from "lucide-react"
import type { User } from "@/types/user"

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc"
type RoleFilter = "all" | "admin" | "user"
type LoginTypeFilter = "all" | "email" | "github" | "google"

const ITEMS_PER_PAGE = 5

const mockUsers: User[] = [
    {
        id: "1",
        username: "admin",
        email: "admin@example.com",
        role: "admin",
        loginType: "email",
        avatar: "/placeholder.svg?height=40&width=40",
        bio: "Administrator sistem dengan pengalaman 5+ tahun dalam troubleshooting komputer",
        banner: "/placeholder.svg?height=200&width=800",
        location: "Jakarta, Indonesia",
        phone: "+62 812-3456-7890",
        website: "https://admin.example.com",
        github: "admin",
        twitter: "admin",
        linkedin: "admin",
        instagram: "admin",
        createdAt: "2024-01-15T08:00:00Z",
        updatedAt: "2024-01-15T08:00:00Z",
        lastLogin: "2024-01-20T10:30:00Z",
    },
    {
        id: "2",
        username: "johndoe",
        email: "john.doe@example.com",
        role: "user",
        loginType: "github",
        avatar: "/placeholder.svg?height=40&width=40",
        bio: "Teknisi komputer yang suka belajar hal baru dan berbagi pengalaman dengan komunitas",
        banner: "/placeholder.svg?height=200&width=800",
        location: "Bandung, Indonesia",
        phone: "+62 813-9876-5432",
        website: "https://johndoe.dev",
        github: "johndoe",
        twitter: "johndoe",
        linkedin: "johndoe",
        instagram: "johndoe",
        createdAt: "2024-01-20T10:30:00Z",
        updatedAt: "2024-01-20T10:30:00Z",
        lastLogin: "2024-01-22T14:15:00Z",
    },
    {
        id: "3",
        username: "janedoe",
        email: "jane.doe@example.com",
        role: "user",
        loginType: "google",
        avatar: "/placeholder.svg?height=40&width=40",
        bio: "Mahasiswa IT yang tertarik dengan dunia teknologi dan troubleshooting",
        banner: "/placeholder.svg?height=200&width=800",
        location: "Surabaya, Indonesia",
        phone: "+62 814-5678-9012",
        website: "",
        github: "janedoe",
        twitter: "",
        linkedin: "janedoe",
        instagram: "janedoe",
        createdAt: "2024-01-25T14:15:00Z",
        updatedAt: "2024-01-25T14:15:00Z",
        lastLogin: "2024-01-26T09:20:00Z",
    },
    {
        id: "4",
        username: "techguru",
        email: "tech.guru@example.com",
        role: "user",
        loginType: "email",
        avatar: "/placeholder.svg?height=40&width=40",
        bio: "Expert dalam hardware dan software troubleshooting dengan 10+ tahun pengalaman",
        banner: "/placeholder.svg?height=200&width=800",
        location: "Yogyakarta, Indonesia",
        phone: "+62 815-2345-6789",
        website: "https://techguru.id",
        github: "techguru",
        twitter: "techguru",
        linkedin: "techguru",
        instagram: "techguru",
        createdAt: "2024-02-01T09:45:00Z",
        updatedAt: "2024-02-01T09:45:00Z",
        lastLogin: "2024-02-02T16:30:00Z",
    },
    {
        id: "5",
        username: "newbie123",
        email: "newbie@example.com",
        role: "user",
        loginType: "google",
        avatar: "/placeholder.svg?height=40&width=40",
        bio: "Pemula yang ingin belajar tentang troubleshooting komputer",
        banner: "/placeholder.svg?height=200&width=800",
        location: "Medan, Indonesia",
        phone: "+62 816-7890-1234",
        website: "",
        github: "",
        twitter: "",
        linkedin: "",
        instagram: "newbie123",
        createdAt: "2024-02-10T16:20:00Z",
        updatedAt: "2024-02-10T16:20:00Z",
        lastLogin: "2024-02-11T08:45:00Z",
    },
]

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>(mockUsers)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [showUserDetail, setShowUserDetail] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [sortBy, setSortBy] = useState<SortOption>("newest")
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
    const [loginTypeFilter, setLoginTypeFilter] = useState<LoginTypeFilter>("all")

    const filteredAndSortedUsers = users
        .filter((user) => {
            const matchesSearch =
                user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.location.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesRole = roleFilter === "all" || user.role === roleFilter
            const matchesLoginType = loginTypeFilter === "all" || user.loginType === loginTypeFilter

            return matchesSearch && matchesRole && matchesLoginType
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                case "oldest":
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                case "name-asc":
                    return a.username.localeCompare(b.username)
                case "name-desc":
                    return b.username.localeCompare(a.username)
                default:
                    return 0
            }
        })

    const totalPages = Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const currentUsers = filteredAndSortedUsers.slice(startIndex, endIndex)

    const handleFilterChange = () => {
        setCurrentPage(1)
    }

    const handleRoleChange = (userId: string, newRole: "admin" | "user") => {
        const user = users.find((u) => u.id === userId)
        if (!user) return

        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
        toast.success(`Role ${user.username} berhasil diubah menjadi ${newRole}`)
    }

    const handleDeleteUser = (user: User) => {
        setUserToDelete(user)
        setShowDeleteDialog(true)
    }

    const confirmDeleteUser = () => {
        if (!userToDelete) return

        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
        toast.success(`User ${userToDelete.username} berhasil dihapus`)
        setShowDeleteDialog(false)
        setUserToDelete(null)
    }

    const handleViewUser = (user: User) => {
        setSelectedUser(user)
        setShowUserDetail(true)
    }

    const handleEditUser = (user: User) => {
        toast.info(`Edit user ${user.username} - Feature coming soon`)
    }

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    const formatDateTime = (dateString: string): string => {
        return new Date(dateString).toLocaleString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getSocialMediaCount = (user: User): number => {
        const socialMedia = [user.github, user.twitter, user.linkedin, user.instagram].filter(Boolean)
        return socialMedia.length
    }

    const getLoginTypeIcon = (loginType: string) => {
        switch (loginType) {
            case "github":
                return <Github className="h-3 w-3" />
            case "google":
                return <div className="h-3 w-3 bg-red-500 rounded-full" />
            case "email":
            default:
                return <Mail className="h-3 w-3" />
        }
    }

    const getLoginTypeBadge = (loginType: string) => {
        const variants = {
            email: "default",
            github: "secondary",
            google: "outline",
        } as const

        return (
            <Badge variant={variants[loginType as keyof typeof variants] || "default"} className="text-xs">
                {getLoginTypeIcon(loginType)}
                <span className="ml-1 capitalize">{loginType}</span>
            </Badge>
        )
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
                                        setSearchTerm(e.target.value)
                                        handleFilterChange()
                                    }}
                                    className="pl-8"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Select
                                    value={sortBy}
                                    onValueChange={(value: SortOption) => {
                                        setSortBy(value)
                                        handleFilterChange()
                                    }}
                                >
                                    <SelectTrigger className="w-[180px]">
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
                                        setRoleFilter(value)
                                        handleFilterChange()
                                    }}
                                >
                                    <SelectTrigger className="w-[120px]">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Role</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="user">User</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={loginTypeFilter}
                                    onValueChange={(value: LoginTypeFilter) => {
                                        setLoginTypeFilter(value)
                                        handleFilterChange()
                                    }}
                                >
                                    <SelectTrigger className="w-[140px]">
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

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pengguna</TableHead>
                                    <TableHead>Lokasi</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Login Type</TableHead>
                                    <TableHead>Media Sosial</TableHead>
                                    <TableHead>Bergabung</TableHead>
                                    <TableHead className="w-[70px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Tidak ada pengguna yang ditemukan
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                                                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{user.username}</div>
                                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                                        {user.bio && (
                                                            <div className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                                                                {user.bio}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    {user.location || "Tidak diset"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={user.role === "admin" ? "default" : "secondary"}
                                                    className="cursor-pointer hover:opacity-80"
                                                    onClick={() => handleRoleChange(user.id, user.role === "admin" ? "user" : "admin")}
                                                >
                                                    {user.role === "admin" ? (
                                                        <>
                                                            <Shield className="h-3 w-3 mr-1" />
                                                            Admin
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye className="h-3 w-3 mr-1" />
                                                            User
                                                        </>
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{getLoginTypeBadge(user.loginType)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {user.github && <Github className="h-3 w-3 text-muted-foreground" />}
                                                    {user.twitter && <Twitter className="h-3 w-3 text-muted-foreground" />}
                                                    {user.linkedin && <Linkedin className="h-3 w-3 text-muted-foreground" />}
                                                    {user.instagram && <Instagram className="h-3 w-3 text-muted-foreground" />}
                                                    <span className="text-xs text-muted-foreground ml-1">{getSocialMediaCount(user)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Lihat Detail
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit Profil
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleRoleChange(user.id, user.role === "admin" ? "user" : "admin")}
                                                        >
                                                            {user.role === "admin" ? (
                                                                <>
                                                                    <UserX className="mr-2 h-4 w-4" />
                                                                    Jadikan User
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UserCheck className="mr-2 h-4 w-4" />
                                                                    Jadikan Admin
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteUser(user)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Hapus User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-6">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                if (currentPage > 1) setCurrentPage(currentPage - 1)
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
                                                            e.preventDefault()
                                                            setCurrentPage(page)
                                                        }}
                                                        isActive={currentPage === page}
                                                        className="cursor-pointer"
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            )
                                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                                            return (
                                                <PaginationItem key={page}>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            )
                                        }
                                        return null
                                    })}

                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                if (currentPage < totalPages) setCurrentPage(currentPage + 1)
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
                                    className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"
                                    style={{
                                        backgroundImage: `url(${selectedUser.banner})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
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
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    Admin
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    User
                                                </>
                                            )}
                                        </Badge>
                                        {getLoginTypeBadge(selectedUser.loginType)}
                                    </div>
                                    {selectedUser.bio && <p className="mt-2 text-sm">{selectedUser.bio}</p>}
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

                                            {selectedUser.location && (
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
                                            {selectedUser.github && (
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

                                            {selectedUser.twitter && (
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

                                            {selectedUser.linkedin && (
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

                                            {selectedUser.instagram && (
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

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus user <strong>{userToDelete?.username}</strong>? Tindakan ini tidak dapat
                            dibatalkan dan akan menghapus semua data yang terkait dengan user ini.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteUser}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Hapus User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
