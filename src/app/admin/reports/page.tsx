// /app/admin/reports/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Flag,
    AlertTriangle,
    CheckCircle,
    XCircle,
    MoreHorizontal,
    Eye,
    Trash2,
    Check,
    ArrowRight,
    Search,
    MessageSquare,
    User,
    ListFilter,
    Clock,
    Link,
    Ban,
} from "lucide-react";
import Fuse from "fuse.js";

import { Report, REPORT_REASONS_MAP, ReportEntityType } from "@/types/types";
import { formatTimeAgo, formatDateTime } from "@/lib/utils/date-utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationLink,
    PaginationNext,
} from "@/components/ui/pagination"; // Import Pagination components
import { Separator } from "@/components/ui/separator";

// Skeleton for a single report row
const ReportRowSkeleton = () => (
    <TableRow>
        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
    </TableRow>
);

export default function AdminReportsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [allReports, setAllReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<"pending" | "resolved" | "dismissed" | "all">("pending");
    const [filterEntityType, setFilterEntityType] = useState<ReportEntityType | "all">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isReportDetailOpen, setIsReportDetailOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // --- Pagination states ---
    const [currentPage, setCurrentPage] = useState(1);
    const [reportsPerPage, setReportsPerPage] = useState(10); // Default items per page

    // --- EFFECT: Admin Authorization Check ---
    useEffect(() => {
        if (status === "loading") return;
        if (!session || session.user.role !== "admin") {
            toast.error("Akses Ditolak", {
                description: "Anda tidak memiliki izin untuk mengakses halaman ini.",
                duration: 3000,
            });
            router.push("/");
        }
    }, [session, status, router]);

    // --- EFFECT: Fetch Reports ---
    const fetchReports = useCallback(async () => {
        if (!session || session.user.role !== "admin") return;

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/admin/reports?status=all`);
            if (!response.ok) {
                throw new Error("Failed to fetch reports.");
            }
            const data = await response.json();
            if (data.status) {
                setAllReports(data.data);
            } else {
                setError(data.message || "Gagal memuat laporan.");
                toast.error("Gagal memuat laporan", { description: data.message });
            }
        } catch (err) {
            console.error("Error fetching reports:", err);
            setError((err as Error).message);
            toast.error("Error", { description: "Terjadi kesalahan saat memuat laporan." });
        } finally {
            setLoading(false);
            setCurrentPage(1); // Reset to first page after fetching new data
        }
    }, [session]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    // Inisialisasi Fuse.js untuk pencarian lokal
    const fuse = useMemo(() => {
        const options = {
            keys: [
                "reporterUsername",
                "reason",
                "details",
                "entityTitle",
                "entityContentPreview",
                "entityUsername",
                "entityAuthorUsername",
                "reportType",
                "status"
            ],
            threshold: 0.3,
        };
        return new Fuse(allReports, options);
    }, [allReports]);

    // --- Filter and Search Reports (Client-side) ---
    const filteredAndSearchedReports = useMemo(() => {
        let currentReports = [...allReports];

        if (filterStatus !== "all") {
            currentReports = currentReports.filter(report => report.status === filterStatus);
        }

        if (filterEntityType !== "all") {
            currentReports = currentReports.filter(report => report.reportType === filterEntityType);
        }

        if (searchQuery.trim()) {
            const fuseResults = fuse.search(searchQuery.trim());
            currentReports = fuseResults.map(result => result.item);
        }

        return currentReports;
    }, [allReports, filterStatus, filterEntityType, searchQuery, fuse]);

    // --- Pagination Logic ---
    const totalPages = Math.ceil(filteredAndSearchedReports.length / reportsPerPage);
    const paginatedReports = useMemo(() => {
        const startIndex = (currentPage - 1) * reportsPerPage;
        const endIndex = startIndex + reportsPerPage;
        return filteredAndSearchedReports.slice(startIndex, endIndex);
    }, [filteredAndSearchedReports, currentPage, reportsPerPage]);


    // --- Report Actions ---
    const handleViewDetails = useCallback((report: Report) => {
        setSelectedReport(report);
        setIsReportDetailOpen(true);
    }, []);

    const handleUpdateReportStatus = useCallback(async (reportId: string, status: "resolved" | "dismissed") => {
        if (!session?.user?.id) {
            toast.error("Anda tidak memiliki izin untuk melakukan aksi ini.");
            return;
        }

        toast.promise(
            (async () => {
                setIsActionLoading(true);
                const response = await fetch(`/api/admin/reports/${reportId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status }),
                });
                const data = await response.json();
                if (!response.ok || !data.status) {
                    throw new Error(data.message || "Gagal memperbarui status laporan.");
                }
                setAllReports(prev => prev.map(r => r.id === reportId ? { ...r, status: status, resolvedAt: new Date().toISOString(), resolvedBy: session.user?.id || null } : r));
                setSelectedReports(new Set());
                setIsReportDetailOpen(false);
                return data;
            })(),
            {
                loading: `Memperbarui laporan ${reportId.substring(0, 8)}...`,
                success: (data) => data.message,
                error: (err) => err.message || "Gagal memperbarui laporan.",
                finally: () => setIsActionLoading(false),
            }
        );
    }, [session]);

    const handleDeleteReport = useCallback(async (reportId: string) => {
        if (!session?.user?.id) {
            toast.error("Anda tidak memiliki izin untuk melakukan aksi ini.");
            return;
        }

        toast.promise(
            (async () => {
                setIsActionLoading(true);
                const response = await fetch(`/api/admin/reports/${reportId}`, { method: "DELETE" });
                const data = await response.json();
                if (!response.ok || !data.status) {
                    throw new Error(data.message || "Gagal menghapus laporan.");
                }
                setAllReports(prev => prev.filter(r => r.id !== reportId));
                setSelectedReports(new Set());
                setIsReportDetailOpen(false);
                return data;
            })(),
            {
                loading: `Menghapus laporan ${reportId.substring(0, 8)}...`,
                success: (data) => data.message,
                error: (err) => err.message || "Gagal menghapus laporan.",
                finally: () => setIsActionLoading(false),
            }
        );
    }, [session]);

    // --- Bulk Actions ---
    const handleToggleSelectAll = useCallback(() => {
        if (selectedReports.size === paginatedReports.length) { // Check against paginatedReports
            setSelectedReports(new Set());
        } else {
            setSelectedReports(new Set(paginatedReports.map(report => report.id))); // Select paginated reports
        }
    }, [selectedReports, paginatedReports]);

    const handleToggleSelectReport = useCallback((reportId: string) => {
        setSelectedReports(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(reportId)) {
                newSelection.delete(reportId);
            } else {
                newSelection.add(reportId);
            }
            return newSelection;
        });
    }, []);

    const handleBulkUpdateStatus = useCallback(async (status: "resolved" | "dismissed") => {
        if (selectedReports.size === 0) {
            toast.error("Tidak ada laporan yang dipilih.");
            return;
        }

        toast.promise(
            (async () => {
                setIsActionLoading(true);
                const results = await Promise.all(
                    Array.from(selectedReports).map(reportId =>
                        fetch(`/api/admin/reports/${reportId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status }),
                        })
                    )
                );
                const failedCount = results.filter(res => !res.ok).length;
                if (failedCount > 0) {
                    throw new Error(`${failedCount} laporan gagal diproses.`);
                }
                fetchReports(); // Re-fetch to ensure consistency
                setSelectedReports(new Set());
                return { message: `${selectedReports.size} laporan berhasil ${status === "resolved" ? "diselesaikan" : "ditolak"}.` };
            })(),
            {
                loading: `Memproses ${selectedReports.size} laporan...`,
                success: (data) => data.message,
                error: (err) => err.message || "Gagal memproses laporan massal.",
                finally: () => setIsActionLoading(false),
            }
        );
    }, [selectedReports, fetchReports, session]);

    const handleBulkDelete = useCallback(async () => {
        if (selectedReports.size === 0) {
            toast.error("Tidak ada laporan yang dipilih.");
            return;
        }

        toast.promise(
            (async () => {
                setIsActionLoading(true);
                const results = await Promise.all(
                    Array.from(selectedReports).map(reportId =>
                        fetch(`/api/admin/reports/${reportId}`, { method: "DELETE" })
                    )
                );
                const failedCount = results.filter(res => !res.ok).length;
                if (failedCount > 0) {
                    throw new Error(`${failedCount} laporan gagal dihapus.`);
                }
                fetchReports(); // Re-fetch to ensure consistency
                setSelectedReports(new Set());
                return { message: `${selectedReports.size} laporan berhasil dihapus.` };
            })(),
            {
                loading: `Menghapus ${selectedReports.size} laporan...`,
                success: (data) => data.message,
                error: (err) => err.message || "Gagal menghapus laporan massal.",
                finally: () => setIsActionLoading(false),
            }
        );
    }, [selectedReports, fetchReports, session]);

    // Statistik ringkasan laporan
    const reportStats = useMemo(() => {
        const total = allReports.length;
        const pending = allReports.filter(r => r.status === "pending").length;
        const resolved = allReports.filter(r => r.status === "resolved").length;
        const dismissed = allReports.filter(r => r.status === "dismissed").length;
        return { total, pending, resolved, dismissed };
    }, [allReports]);

    // Tentukan apakah admin sudah terautentikasi dan data awal sudah dimuat
    const isAuthorizedAndLoaded = status !== "loading" && session?.user?.role === "admin" && !loading;

    if (status === "loading" || loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Skeleton className="h-10 w-48 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </div>
                <div className="flex gap-4 mb-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"><Skeleton className="h-4 w-4" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-12" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-48" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                            <TableHead className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <ReportRowSkeleton key={i} />
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    if (!isAuthorizedAndLoaded) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Akses Ditolak</h2>
                <p className="text-muted-foreground mb-4">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
                <Button type="button" onClick={() => router.push("/")}>Kembali ke Beranda</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <Flag className="h-8 w-8 text-red-500" />
                Panel Laporan Admin
            </h1>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Laporan Pending</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {reportStats.pending}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Laporan yang perlu ditinjau
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Laporan Diselesaikan</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {reportStats.resolved}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Laporan yang telah ditindaklanjuti
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Laporan Ditolak</CardTitle>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {reportStats.dismissed}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Laporan yang ditutup tanpa tindakan
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Select value={filterStatus} onValueChange={(value: typeof filterStatus) => {
                    setFilterStatus(value);
                    setCurrentPage(1); // Reset page on filter change
                }}>
                    <SelectTrigger className="w-full md:w-48">
                        <ListFilter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Diselesaikan</SelectItem>
                        <SelectItem value="dismissed">Ditolak</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterEntityType} onValueChange={(value: typeof filterEntityType) => {
                    setFilterEntityType(value);
                    setCurrentPage(1); // Reset page on filter change
                }}>
                    <SelectTrigger className="w-full md:w-48">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter Tipe Entitas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Tipe</SelectItem>
                        <SelectItem value="forum_post">Postingan</SelectItem>
                        <SelectItem value="forum_reply">Komentar</SelectItem>
                        <SelectItem value="user">Pengguna</SelectItem>
                    </SelectContent>
                </Select>

                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Cari pelapor, alasan, konten..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1); // Reset page on search change
                        }}
                        className="pl-10 w-full"
                    />
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedReports.size > 0 && (
                <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg mb-4">
                    <span className="text-sm text-muted-foreground">
                        {selectedReports.size} laporan dipilih
                    </span>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleBulkUpdateStatus("resolved")}
                            disabled={isActionLoading}
                        >
                            <Check className="h-4 w-4 mr-2" /> Selesaikan
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleBulkUpdateStatus("dismissed")}
                            disabled={isActionLoading}
                        >
                            <XCircle className="h-4 w-4 mr-2" /> Tolak
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={isActionLoading}
                        >
                            <Trash2 className="h-4 w-4 mr-2" /> Hapus
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <AlertTriangle className="h-5 w-5 text-red-500 inline mr-2" />
            )}
            {paginatedReports.length === 0 && !loading && !error && (
                <p className="text-center text-muted-foreground py-10">Tidak ada laporan ditemukan untuk filter ini.</p>
            )}
            {paginatedReports.length > 0 && ( // Only render table if there are reports to show
                <>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={selectedReports.size === paginatedReports.length && paginatedReports.length > 0}
                                        onCheckedChange={handleToggleSelectAll}
                                        disabled={paginatedReports.length === 0 || isActionLoading}
                                    />
                                </TableHead>
                                <TableHead>ID Laporan</TableHead>
                                <TableHead>Pelapor</TableHead>
                                <TableHead>Tipe</TableHead>
                                <TableHead>Alasan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Dilaporkan Pada</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedReports.map((report) => (
                                <TableRow key={report.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedReports.has(report.id)}
                                            onCheckedChange={() => handleToggleSelectReport(report.id)}
                                            disabled={isActionLoading}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <Badge variant="outline">{report.id.substring(0, 8)}...</Badge>
                                    </TableCell>
                                    <TableCell>{report.reporterUsername}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {report.reportType === "forum_post" ? "Post" : report.reportType === "forum_reply" ? "Komentar" : "Pengguna"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{REPORT_REASONS_MAP[report.reportType]?.find(r => r.value === report.reason)?.label || report.reason}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                report.status === "pending"
                                                    ? "destructive"
                                                    : report.status === "resolved"
                                                        ? "default"
                                                        : "secondary"
                                            }
                                        >
                                            {report.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatTimeAgo(report.createdAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewDetails(report)}
                                            disabled={isActionLoading}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                            }
                        </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    <div className="mt-6 flex justify-between items-center">
                        <Select
                            value={String(reportsPerPage)}
                            onValueChange={(value) => {
                                setReportsPerPage(Number(value));
                                setCurrentPage(1); // Reset page when items per page changes
                            }}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Laporan per halaman" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5 per halaman</SelectItem>
                                <SelectItem value="10">10 per halaman</SelectItem>
                                <SelectItem value="20">20 per halaman</SelectItem>
                                <SelectItem value="50">50 per halaman</SelectItem>
                            </SelectContent>
                        </Select>

                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); setCurrentPage(prev => Math.max(1, prev - 1)); }}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                                    />
                                </PaginationItem>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            href="#"
                                            isActive={page === currentPage}
                                            onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                                        >
                                            {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); setCurrentPage(prev => Math.min(totalPages, prev + 1)); }}
                                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </>
            )}

            {/* Report Detail Dialog */}
            <Dialog open={isReportDetailOpen} onOpenChange={setIsReportDetailOpen}>
                <DialogContent className="sm:max-w-md md:max-w-lg" onClick={e => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Flag className="h-5 w-5 text-red-500" />
                            Detail Laporan ({selectedReport?.id.substring(0, 8)}...)
                        </DialogTitle>
                        <DialogDescription>
                            Tinjau laporan ini dan tentukan tindakan yang sesuai.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedReport && (
                        <div className="grid gap-4 py-4 text-sm">
                            <p><strong>Pelapor:</strong> {selectedReport.reporterUsername}</p>
                            <p><strong>Tipe Laporan:</strong>{" "}
                                <Badge variant="secondary">
                                    {selectedReport.reportType === "forum_post" ? "Postingan" : selectedReport.reportType === "forum_reply" ? "Komentar" : "Pengguna"}
                                </Badge>
                            </p>
                            <p><strong>Alasan:</strong> {REPORT_REASONS_MAP[selectedReport.reportType]?.find(r => r.value === selectedReport.reason)?.label || selectedReport.reason}</p>
                            {selectedReport.details && <p><strong>Detail Tambahan:</strong> {selectedReport.details}</p>}
                            <p><strong>Status:</strong>{" "}
                                <Badge
                                    variant={
                                        selectedReport.status === "pending"
                                            ? "destructive"
                                            : selectedReport.status === "resolved"
                                                ? "default"
                                                : "secondary"
                                    }
                                >
                                    {selectedReport.status}
                                </Badge>
                            </p>
                            <p><strong>Dilaporkan Pada:</strong> {formatDateTime(selectedReport.createdAt)}</p>
                            {selectedReport.resolvedAt && selectedReport.resolvedBy && (
                                <p><strong>Diselesaikan Pada:</strong> {formatDateTime(selectedReport.resolvedAt)} <strong>Oleh:</strong> {selectedReport.resolvedBy}</p>
                            )}
                            {selectedReport.resolvedAt && !selectedReport.resolvedBy && (
                                <p><strong>Diselesaikan Pada:</strong> {formatDateTime(selectedReport.resolvedAt)}</p>
                            )}


                            <Separator />

                            <p className="font-semibold">Informasi Entitas Terlapor:</p>
                            {selectedReport.entityTitle && <p><strong>Judul Post:</strong> &quot;{selectedReport.entityTitle}&quot;</p>}
                            {selectedReport.entityContentPreview && <p><strong>Preview Konten:</strong> &quot;{selectedReport.entityContentPreview}&quot;</p>}
                            {selectedReport.entityUsername && <p><strong>Username Terlapor:</strong> &quot;{selectedReport.entityUsername}&quot;</p>}
                            {selectedReport.entityAuthorUsername && <p><strong>Penulis Konten:</strong> &quot;{selectedReport.entityAuthorUsername}&quot;</p>}
                            <p><strong>ID Entitas:</strong> <Badge variant="outline">{selectedReport.entityId}</Badge></p>

                            {selectedReport.entityLink && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { window.open(selectedReport.entityLink!, '_blank'); setIsReportDetailOpen(false); }}
                                    className="w-full justify-start mt-2"
                                    disabled={isActionLoading}
                                >
                                    <Link className="h-4 w-4 mr-2" />
                                    Lihat Entitas ({selectedReport.reportType === "user" ? "Profil" : "Konten"})
                                </Button>
                            )}
                            {selectedReport.status === "pending" && (
                                <>
                                    {selectedReport.reportType === "user" && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() => { toast.info("Fitur Ban Pengguna belum diimplementasikan."); }}
                                            className="w-full justify-start"
                                            disabled={isActionLoading}
                                        >
                                            <Ban className="h-4 w-4 mr-2" /> Ban Pengguna
                                        </Button>
                                    )}
                                    {(selectedReport.reportType === "forum_post" || selectedReport.reportType === "forum_reply") && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() => { toast.info("Fitur Hapus Konten belum diimplementasikan."); }}
                                            className="w-full justify-start"
                                            disabled={isActionLoading}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Hapus Konten
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="destructive" onClick={() => handleDeleteReport(selectedReport!.id)} disabled={isActionLoading}>
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus Laporan
                        </Button>
                        {selectedReport?.status === "pending" ? (
                            <>
                                <Button type="button" variant="secondary" onClick={() => handleUpdateReportStatus(selectedReport!.id, "dismissed")} disabled={isActionLoading}>
                                    <XCircle className="mr-2 h-4 w-4" /> Tolak Laporan
                                </Button>
                                <Button type="button" onClick={() => handleUpdateReportStatus(selectedReport!.id, "resolved")} disabled={isActionLoading}>
                                    <CheckCircle className="mr-2 h-4 w-4" /> Selesaikan Laporan
                                </Button>
                            </>
                        ) : (
                            <Button type="button" onClick={() => setIsReportDetailOpen(false)} disabled={isActionLoading}>
                                Tutup
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}