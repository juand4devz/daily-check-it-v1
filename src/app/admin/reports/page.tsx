// [path_to_your_file]/AdminReportsPage.tsx
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
    Search,
    MessageSquare,
    Clock,
    Link,
    Ban,
    BarChart,
    RefreshCcw,
    Calendar,
    LandPlot,
} from "lucide-react";
import Fuse from "fuse.js";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationLink,
    PaginationNext,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

import { Report, REPORT_REASONS_MAP, ReportEntityType } from "@/types/types";
import { formatTimeAgo, formatDateTime } from "@/lib/utils/date-utils";

// --- Konstanta & Helper Functions ---
const ITEMS_PER_PAGE = 10;
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A155B9', '#F99417'];

const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

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

// --- Komponen Utama ---
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
    const [currentPage, setCurrentPage] = useState(1);
    const [reportsPerPage, setReportsPerPage] = useState(ITEMS_PER_PAGE);

    // --- Chart Filter States ---
    const [chartTimeframe, setChartTimeframe] = useState<"day" | "week" | "month">("month");

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

    // --- EFFECT: Fetch Reports (Diperbaiki untuk menangani Timestamp) ---
    const fetchReports = useCallback(async () => {
        if (!session || session.user.role !== "admin") return;

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/admin/reports?status=all`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to fetch reports.");
            }
            const data = await response.json();
            if (data.status) {
                const processedReports: Report[] = data.data.map((report: any) => ({
                    ...report,
                    createdAt: report.createdAt instanceof Date ? report.createdAt.toISOString() : report.createdAt,
                    resolvedAt: report.resolvedAt instanceof Date ? report.resolvedAt.toISOString() : report.resolvedAt,
                }));
                setAllReports(processedReports);
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
        }
    }, [session]);

    useEffect(() => {
        if (session?.user?.role === "admin") {
            fetchReports();
        }
    }, [session]);

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

        return currentReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [allReports, filterStatus, filterEntityType, searchQuery, fuse]);

    // --- Statistik & Chart Logic ---
    const reportStats = useMemo(() => {
        const total = allReports.length;
        const pending = allReports.filter(r => r.status === "pending").length;
        const resolved = allReports.filter(r => r.status === "resolved").length;
        const dismissed = allReports.filter(r => r.status === "dismissed").length;
        return { total, pending, resolved, dismissed };
    }, [allReports]);

    const aggregateReports = useCallback((reports: Report[], timeframe: "day" | "week" | "month") => {
        const counts: Record<string, number> = {};
        const dates: Date[] = reports.map(r => new Date(r.createdAt));
        if (dates.length === 0) {
            return { data: [], dateRange: null };
        }

        const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));

        const chartData = [];
        let currentDate = new Date(earliestDate);
        while (currentDate <= latestDate) {
            let key = "";
            let name = "";
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth();

            switch (timeframe) {
                case "day":
                    key = currentDate.toISOString().split('T')[0];
                    name = `${currentDate.getDate()} ${currentDate.toLocaleString('id-ID', { month: 'short' })}`;
                    break;
                case "week":
                    key = `${currentYear}-W${getWeekNumber(currentDate)}`;
                    name = `Minggu ${getWeekNumber(currentDate)}`;
                    break;
                case "month":
                    key = `${currentYear}-${currentMonth + 1}`;
                    name = currentDate.toLocaleString('id-ID', { month: 'long' });
                    break;
            }

            const count = reports.filter(report => {
                const reportDate = new Date(report.createdAt);
                switch (timeframe) {
                    case "day":
                        return reportDate.toISOString().split('T')[0] === key;
                    case "week":
                        return `${reportDate.getFullYear()}-W${getWeekNumber(reportDate)}` === key;
                    case "month":
                        return `${reportDate.getFullYear()}-${reportDate.getMonth() + 1}` === key;
                }
            }).length;

            chartData.push({ name, "Jumlah Laporan": count });

            // Increment date for the next iteration
            if (timeframe === "day") {
                currentDate.setDate(currentDate.getDate() + 1);
            } else if (timeframe === "week") {
                currentDate.setDate(currentDate.getDate() + 7);
            } else if (timeframe === "month") {
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        }

        return {
            data: chartData,
            dateRange: { earliest: earliestDate, latest: latestDate }
        };
    }, []);

    const { data: chartData, dateRange } = useMemo(() => {
        return aggregateReports(allReports, chartTimeframe);
    }, [allReports, chartTimeframe, aggregateReports]);

    const entityTypeChartData = useMemo(() => {
        const counts = allReports.reduce((acc, report) => {
            const type = report.reportType;
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value], index) => ({
            name: name === 'forum_post' ? 'Postingan' : name === 'forum_reply' ? 'Komentar' : 'Pengguna',
            value,
            fill: PIE_COLORS[index % PIE_COLORS.length]
        }));
    }, [allReports]);

    const formattedDateRange = useMemo(() => {
        if (allReports.length === 0 || !dateRange) return "Tidak ada data";
        const earliest = dateRange.earliest.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const latest = dateRange.latest.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        return `Data dari ${earliest} - ${latest}`;
    }, [allReports, dateRange]);


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

    // ** Perbaikan: Tambahkan helper function untuk membuat URL entitas yang konsisten **
    const getEntityUrl = useCallback((report: Report) => {
        if (report.reportType === "user") {
            // Perbaiki: Gunakan URL /users/[id] yang sesuai dengan frontend
            return `/users/${report.entityId}`;
        }
        // Asumsi untuk post/reply, URL nya sudah benar dari API
        return report.entityLink;
    }, []);

    // ** Perbaikan: Tambahkan fungsi terpusat untuk membuka entitas **
    const handleOpenEntity = useCallback((report: Report) => {
        const url = getEntityUrl(report);
        if (url) {
            window.open(url, '_blank');
        } else {
            toast.error("URL entitas tidak valid.");
        }
    }, [getEntityUrl]);


    const handleUpdateReportStatus = useCallback(async (reportId: string, status: "resolved" | "dismissed") => {
        if (!session?.user?.id) {
            toast.error("Anda tidak memiliki izin untuk melakukan aksi ini.");
            return;
        }

        const toastId = toast.loading(`Memperbarui laporan ${reportId.substring(0, 8)}...`);
        setIsActionLoading(true);

        try {
            const response = await fetch(`/api/admin/reports/${reportId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, resolvedBy: session.user.id }),
            });
            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(data.message || "Gagal memperbarui status laporan.");
            }

            // Update local state instead of re-fetching
            setAllReports(prev => prev.map(r => r.id === reportId ? { ...r, status, resolvedAt: new Date().toISOString() } : r));
            setSelectedReports(prev => {
                const newSelection = new Set(prev);
                newSelection.delete(reportId);
                return newSelection;
            });

            toast.success(data.message || `Laporan ${reportId.substring(0, 8)} berhasil diperbarui.`, { id: toastId });
            setIsReportDetailOpen(false);
        } catch (err: any) {
            console.error("Error updating report:", err);
            toast.error(err.message || "Gagal memperbarui laporan.", { id: toastId });
        } finally {
            setIsActionLoading(false);
        }
    }, [session]);

    const handleDeleteReport = useCallback(async (reportId: string) => {
        if (!session?.user?.id) {
            toast.error("Anda tidak memiliki izin untuk melakukan aksi ini.");
            return;
        }

        const toastId = toast.loading(`Menghapus laporan ${reportId.substring(0, 8)}...`);
        setIsActionLoading(true);

        try {
            const response = await fetch(`/api/admin/reports/${reportId}`, { method: "DELETE" });
            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(data.message || "Gagal menghapus laporan.");
            }

            // Update local state by filtering out deleted reports
            setAllReports(prev => prev.filter(r => r.id !== reportId));
            setSelectedReports(prev => {
                const newSelection = new Set(prev);
                newSelection.delete(reportId);
                return newSelection;
            });

            toast.success(data.message || `Laporan ${reportId.substring(0, 8)} berhasil dihapus.`, { id: toastId });
            setIsReportDetailOpen(false);
        } catch (err: any) {
            console.error("Error deleting report:", err);
            toast.error(err.message || "Gagal menghapus laporan massal.", { id: toastId });
        } finally {
            setIsActionLoading(false);
        }
    }, [session]);

    // --- Bulk Actions ---
    const handleToggleSelectAll = useCallback(() => {
        if (selectedReports.size === paginatedReports.length) {
            setSelectedReports(new Set());
        } else {
            setSelectedReports(new Set(paginatedReports.map(report => report.id)));
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

        const toastId = toast.loading(`Memproses ${selectedReports.size} laporan...`);
        setIsActionLoading(true);

        try {
            const updatePromises = Array.from(selectedReports).map(reportId =>
                fetch(`/api/admin/reports/${reportId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status, resolvedBy: session?.user?.id }),
                }).then(res => res.json())
            );

            const results = await Promise.all(updatePromises);
            const failedResults = results.filter(res => !res.status);

            if (failedResults.length > 0) {
                throw new Error(`${failedResults.length} laporan gagal diproses.`);
            }

            // Update local state for each successfully processed report
            const selectedIds = Array.from(selectedReports);
            setAllReports(prev => prev.map(r => selectedIds.includes(r.id) ? { ...r, status, resolvedAt: new Date().toISOString() } : r));
            setSelectedReports(new Set());

            toast.success(`${selectedIds.length} laporan berhasil ${status === "resolved" ? "diselesaikan" : "ditolak"}.`, { id: toastId });
        } catch (err: any) {
            console.error("Error processing bulk action:", err);
            toast.error(err.message || "Gagal memproses laporan massal.", { id: toastId });
        } finally {
            setIsActionLoading(false);
        }
    }, [selectedReports, session]);

    const handleBulkDelete = useCallback(async () => {
        if (selectedReports.size === 0) {
            toast.error("Tidak ada laporan yang dipilih.");
            return;
        }

        const toastId = toast.loading(`Menghapus ${selectedReports.size} laporan...`);
        setIsActionLoading(true);

        try {
            const deletePromises = Array.from(selectedReports).map(reportId =>
                fetch(`/api/admin/reports/${reportId}`, { method: "DELETE" }).then(res => res.json())
            );
            const results = await Promise.all(deletePromises);
            const failedResults = results.filter(res => !res.status);

            if (failedResults.length > 0) {
                throw new Error(`${failedResults.length} laporan gagal dihapus.`);
            }

            // Update local state by filtering out deleted reports
            const selectedIds = Array.from(selectedReports);
            setAllReports(prev => prev.filter(r => !selectedIds.includes(r.id)));
            setSelectedReports(new Set());

            toast.success(`${selectedIds.length} laporan berhasil dihapus.`, { id: toastId });
        } catch (err: any) {
            console.error("Error processing bulk delete:", err);
            toast.error(err.message || "Gagal menghapus laporan massal.", { id: toastId });
        } finally {
            setIsActionLoading(false);
        }
    }, [selectedReports, session]);

    if (status === "loading" || (status === "authenticated" && loading)) {
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

    if (status === "unauthenticated" || (status === "authenticated" && !session?.user?.role)) {
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
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <LandPlot className="h-10 w-10 mr-2" />
                    Panel Laporan Admin
                </h1>
                <Button variant="outline" size="sm" onClick={fetchReports} disabled={isActionLoading}>
                    <RefreshCcw className={`h-4 w-4 mr-2 ${isActionLoading ? 'animate-spin' : ''}`} />
                    Segarkan Data
                </Button>
            </div>

            <Tabs defaultValue="statistics">
                <TabsList className="grid w-full md:w-fit grid-cols-2">
                    <TabsTrigger value="statistics" className="flex items-center gap-2">
                        <BarChart className="h-4 w-4" />
                        Statistik
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Data Laporan
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="statistics" className="mt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Laporan Pending</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reportStats.pending}</div>
                                <p className="text-xs text-muted-foreground">Laporan yang perlu ditinjau</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Laporan Diselesaikan</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reportStats.resolved}</div>
                                <p className="text-xs text-muted-foreground">Laporan yang telah ditindaklanjuti</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Laporan Ditolak</CardTitle>
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reportStats.dismissed}</div>
                                <p className="text-xs text-muted-foreground">Laporan yang ditutup tanpa tindakan</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        <Card>
                            <CardHeader className="flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between space-y-0">
                                <CardTitle>Laporan Masuk</CardTitle>
                                <Select value={chartTimeframe} onValueChange={(value: "day" | "week" | "month") => setChartTimeframe(value)}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="Waktu" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="day">Harian</SelectItem>
                                        <SelectItem value="week">Mingguan</SelectItem>
                                        <SelectItem value="month">Bulanan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis allowDecimals={false} />
                                            <ChartTooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="Jumlah Laporan" stroke="#ef4444" activeDot={{ r: 8 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                {allReports.length > 0 && (
                                    <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        <span>{formattedDateRange}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Distribusi Tipe Laporan</CardTitle>
                                <CardDescription>Persentase laporan berdasarkan jenis entitas.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={entityTypeChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%" cy="50%"
                                                outerRadius={100}
                                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                fill="#8884d8"
                                            >
                                                {entityTypeChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <ChartTooltip formatter={(value: number, name: string) => [`${value} laporan`, name]} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="reports" className="mt-4 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle>Daftar Laporan</CardTitle>
                                <CardDescription>Total {filteredAndSearchedReports.length} laporan ditemukan.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row gap-4 mb-4">
                                <Select value={filterStatus} onValueChange={(value: typeof filterStatus) => {
                                    setFilterStatus(value);
                                    setCurrentPage(1);
                                }}>
                                    <SelectTrigger className="w-full md:w-48">
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
                                    setCurrentPage(1);
                                }}>
                                    <SelectTrigger className="w-full md:w-48">
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
                                            setCurrentPage(1);
                                        }}
                                        className="pl-10 w-full"
                                    />
                                </div>
                            </div>

                            {selectedReports.size > 0 && (
                                <div className="flex justify-between items-center bg-muted/50 border p-3 rounded-lg mb-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                                    <span className="text-sm text-muted-foreground">
                                        {selectedReports.size} laporan dipilih
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        <Button type="button" variant="secondary" size="sm" onClick={() => handleBulkUpdateStatus("resolved")} disabled={isActionLoading}>
                                            <Check className="h-4 w-4 mr-2" /> Selesaikan
                                        </Button>
                                        <Button type="button" variant="secondary" size="sm" onClick={() => handleBulkUpdateStatus("dismissed")} disabled={isActionLoading}>
                                            <XCircle className="h-4 w-4 mr-2" /> Tolak
                                        </Button>
                                        <Button type="button" variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isActionLoading}>
                                            <Trash2 className="h-4 w-4 mr-2" /> Hapus
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {error ? (
                                <p className="text-center text-red-500 py-10">Error: {error}</p>
                            ) : paginatedReports.length === 0 ? (
                                <p className="text-center text-muted-foreground py-10">Tidak ada laporan ditemukan untuk filter ini.</p>
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">
                                                    <Checkbox
                                                        checked={selectedReports.size > 0 && selectedReports.size === paginatedReports.length}
                                                        onCheckedChange={handleToggleSelectAll}
                                                        disabled={paginatedReports.length === 0 || isActionLoading}
                                                    />
                                                </TableHead>
                                                <TableHead>ID</TableHead>
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
                                                    <TableCell><Checkbox checked={selectedReports.has(report.id)} onCheckedChange={() => handleToggleSelectReport(report.id)} disabled={isActionLoading} /></TableCell>
                                                    <TableCell className="font-medium">
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Badge variant="outline" className="cursor-pointer">#{report.id.substring(0, 8)}...</Badge>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-80">
                                                                <p className="text-sm font-medium">ID Laporan</p>
                                                                <p className="text-xs break-all">{report.id}</p>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </TableCell>
                                                    <TableCell>{report.reporterUsername}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="capitalize">
                                                            {report.reportType.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <span className="text-sm hover:underline cursor-pointer">
                                                                    {REPORT_REASONS_MAP[report.reportType]?.find(r => r.value === report.reason)?.label || report.reason}
                                                                </span>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-80">
                                                                <p className="text-sm font-medium">Alasan:</p>
                                                                <p className="text-xs">{report.reason}</p>
                                                                {report.details && (
                                                                    <>
                                                                        <Separator className="my-2" />
                                                                        <p className="text-sm font-medium">Detail Tambahan:</p>
                                                                        <p className="text-xs">{report.details}</p>
                                                                    </>
                                                                )}
                                                            </PopoverContent>
                                                        </Popover>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                report.status === "pending"
                                                                    ? "destructive"
                                                                    : report.status === "resolved"
                                                                        ? "default"
                                                                        : "secondary"
                                                            }
                                                            className="w-fit capitalize"
                                                        >
                                                            {report.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{formatTimeAgo(report.createdAt)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isActionLoading}><MoreHorizontal className="h-4 w-4" /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleViewDetails(report)} disabled={isActionLoading}>
                                                                    <Eye className="mr-2 h-4 w-4" /> Lihat Detail
                                                                </DropdownMenuItem>
                                                                {report.entityLink && (
                                                                    // Perbaikan: Panggil fungsi helper yang baru
                                                                    <DropdownMenuItem onClick={() => handleOpenEntity(report)} disabled={isActionLoading}>
                                                                        <Link className="mr-2 h-4 w-4" /> Buka Entitas
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {report.status === "pending" && (
                                                                    <>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem onClick={() => handleUpdateReportStatus(report.id, "resolved")} disabled={isActionLoading}>
                                                                            <CheckCircle className="mr-2 h-4 w-4" /> Selesaikan
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleUpdateReportStatus(report.id, "dismissed")} disabled={isActionLoading}>
                                                                            <XCircle className="mr-2 h-4 w-4" /> Tolak
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleDeleteReport(report.id)} className="text-destructive focus:text-destructive" disabled={isActionLoading}>
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Hapus Laporan
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    <div className="mt-6 flex justify-between items-center">
                                        <Select
                                            value={String(reportsPerPage)}
                                            onValueChange={(value) => {
                                                setReportsPerPage(Number(value));
                                                setCurrentPage(1);
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
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isReportDetailOpen} onOpenChange={setIsReportDetailOpen}>
                <DialogContent className="sm:max-w-md md:max-w-lg">
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
                            <div className="grid grid-cols-2 items-center">
                                <p className="font-semibold">Pelapor:</p>
                                <p>{selectedReport.reporterUsername}</p>
                            </div>
                            <div className="grid grid-cols-2 items-center">
                                <p className="font-semibold">Tipe Laporan:</p>
                                <Badge variant="secondary" className="w-fit capitalize">
                                    {selectedReport.reportType.replace('_', ' ')}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 items-start">
                                <p className="font-semibold">Alasan:</p>
                                <p>{REPORT_REASONS_MAP[selectedReport.reportType]?.find(r => r.value === selectedReport.reason)?.label || selectedReport.reason}</p>
                            </div>
                            {selectedReport.details && (
                                <div className="grid grid-cols-2 items-start">
                                    <p className="font-semibold">Detail Tambahan:</p>
                                    <p>{selectedReport.details}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 items-center">
                                <p className="font-semibold">Status:</p>
                                <Badge
                                    variant={
                                        selectedReport.status === "pending"
                                            ? "destructive"
                                            : selectedReport.status === "resolved"
                                                ? "default"
                                                : "secondary"
                                    }
                                    className="w-fit capitalize"
                                >
                                    {selectedReport.status}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 items-center">
                                <p className="font-semibold">Dilaporkan Pada:</p>
                                <p>{formatDateTime(selectedReport.createdAt)}</p>
                            </div>
                            {selectedReport.resolvedAt && selectedReport.resolvedBy && (
                                <div className="grid grid-cols-2 items-center">
                                    <p className="font-semibold">Diselesaikan:</p>
                                    <p>{formatDateTime(selectedReport.resolvedAt)} oleh {selectedReport.resolvedBy}</p>
                                </div>
                            )}

                            <Separator className="my-2" />

                            <p className="font-bold text-base">Informasi Entitas Terlapor:</p>
                            {selectedReport.entityTitle && <p><strong>Judul:</strong> &quot;{selectedReport.entityTitle}&quot;</p>}
                            {selectedReport.entityContentPreview && <p><strong>Preview Konten:</strong> &quot;{selectedReport.entityContentPreview}&quot;</p>}
                            {selectedReport.entityUsername && <p><strong>Username Terlapor:</strong> {selectedReport.entityUsername}</p>}
                            {selectedReport.entityAuthorUsername && <p><strong>Penulis Konten:</strong> {selectedReport.entityAuthorUsername}</p>}
                            <p><strong>ID Entitas:</strong> <Badge variant="outline">{selectedReport.entityId}</Badge></p>

                            {selectedReport.entityLink && (
                                // Perbaikan: Panggil fungsi helper yang baru
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        handleOpenEntity(selectedReport);
                                        setIsReportDetailOpen(false); // Pastikan dialog tertutup setelah navigasi
                                    }}
                                    className="w-full justify-start mt-2"
                                    disabled={isActionLoading}
                                >
                                    <Link className="h-4 w-4 mr-2" />
                                    Lihat Entitas ({selectedReport.reportType === "user" ? "Profil" : "Konten"})
                                </Button>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        {selectedReport?.status === "pending" && (
                            <>
                                <Button type="button" variant="secondary" onClick={() => handleUpdateReportStatus(selectedReport!.id, "dismissed")} disabled={isActionLoading}>
                                    <XCircle className="mr-2 h-4 w-4" /> Tolak
                                </Button>
                                <Button type="button" onClick={() => handleUpdateReportStatus(selectedReport!.id, "resolved")} disabled={isActionLoading}>
                                    <CheckCircle className="mr-2 h-4 w-4" /> Selesaikan
                                </Button>
                            </>
                        )}
                        <Button type="button" variant="destructive" onClick={() => handleDeleteReport(selectedReport!.id)} disabled={isActionLoading}>
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus Laporan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}