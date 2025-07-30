// /components/shared/ReportDialog.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Flag } from "lucide-react";
import { REPORT_REASONS_MAP, ReportReason, ReportEntityType } from "@/types/types";
import { useSession } from "next-auth/react";

interface ReportDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    reportType: ReportEntityType;
    entityId: string;
    entityTitle?: string;
    entityContentPreview?: string;
    entityUsername?: string;
    entityAuthorId?: string;
    entityAuthorUsername?: string;
    postIdForReply?: string;
}

export function ReportDialog({
    isOpen,
    onOpenChange,
    reportType,
    entityId,
    entityTitle,
    entityContentPreview,
    entityUsername,
    entityAuthorId,
    entityAuthorUsername,
    postIdForReply,
}: ReportDialogProps) {
    const { data: session } = useSession();
    const [selectedReason, setSelectedReason] = useState<ReportReason | "">("");
    const [details, setDetails] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedReason("");
            setDetails("");
        }
    }, [isOpen]);

    const handleReportSubmit = useCallback(async () => {
        if (!session?.user?.id || !session?.user?.username) {
            toast.error("Anda harus login untuk melaporkan.");
            onOpenChange(false);
            return;
        }
        if (!selectedReason) {
            toast.error("Pilih alasan laporan.");
            return;
        }

        setIsSubmitting(true);
        try {
            const reportPayload: Record<string, any> = {
                reportType,
                entityId,
                reason: selectedReason,
                // PENTING: Ubah undefined menjadi null untuk field opsional
                details: details.trim() || null, // Ubah undefined menjadi null
                entityTitle: entityTitle || null, // Ubah undefined menjadi null
                entityContentPreview: entityContentPreview || null, // Ubah undefined menjadi null
                entityUsername: entityUsername || null, // Ubah undefined menjadi null
                entityAuthorId: entityAuthorId || null, // Ubah undefined menjadi null
                entityAuthorUsername: entityAuthorUsername || null, // Ubah undefined menjadi null
            };

            if (reportType === "forum_reply" && postIdForReply) {
                reportPayload.postIdForReply = postIdForReply;
            }

            console.log("Mengirim payload laporan:", reportPayload); // Debugging: Log payload sebelum kirim

            const response = await fetch("/api/admin/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reportPayload),
            });

            const data = await response.json();

            if (response.ok && data.status) {
                toast.success("Laporan berhasil dikirim", {
                    description: "Terima kasih atas laporan Anda. Kami akan meninjauya segera.",
                });
                onOpenChange(false);
            } else {
                console.error("API response error:", data.message || "Tidak ada pesan dari API.");
                throw new Error(data.message || "Gagal mengirim laporan. Cek konsol server.");
            }
        } catch (error) {
            console.error("Error submitting report (frontend):", error);
            toast.error("Gagal mengirim laporan", {
                description: error instanceof Error ? error.message : "Terjadi kesalahan saat mengirim laporan",
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [session, selectedReason, details, reportType, entityId, entityTitle, entityContentPreview, entityUsername, entityAuthorId, entityAuthorUsername, postIdForReply, onOpenChange]);

    const reasons = REPORT_REASONS_MAP[reportType] || [];

    const dialogTitleText = `Laporkan ${reportType === "forum_post" ? "Postingan" : reportType === "forum_reply" ? "Komentar" : "Pengguna"}`;
    const dialogDescriptionText = `Bantu kami menjaga keamanan dan kualitas komunitas. Laporkan konten atau pengguna yang melanggar aturan komunitas kami.`;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {/* PENTING: Tambahkan onClick={e => e.stopPropagation()} di sini untuk mengisolasi klik */}
            <DialogContent className="sm:max-w-[425px]" onClick={e => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Flag className="h-5 w-5 text-red-500" />
                        {dialogTitleText}
                    </DialogTitle>
                    <DialogDescription>
                        {dialogDescriptionText}
                    </DialogDescription>
                </DialogHeader>

                {(entityTitle || entityContentPreview || entityUsername || entityAuthorUsername) && (
                    <div className="mt-2 text-sm text-muted-foreground">
                        <p className="font-semibold">Detail yang dilaporkan:</p>
                        {entityTitle && <p>Post: &quot;{entityTitle}&quot;</p>}
                        {entityContentPreview && <p>Komentar: &quot;{entityContentPreview}&quot;</p>}
                        {entityUsername && <p>Pengguna: &quot;{entityUsername}&quot;</p>}
                        {entityAuthorUsername && <p>Penulis: &quot;{entityAuthorUsername}&quot;</p>}
                    </div>
                )}

                <div className="grid gap-4 py-4">
                    <RadioGroup
                        onValueChange={(value: ReportReason) => {
                            setSelectedReason(value);
                        }}
                        value={selectedReason}
                        className="space-y-2"
                        disabled={isSubmitting}
                    >
                        {reasons.map((r) => (
                            <div key={r.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
                                <Label htmlFor={`reason-${r.value}`} className="cursor-pointer">
                                    <span className="font-medium">{r.label}</span>
                                    <span className="text-xs text-muted-foreground ml-1">({r.description})</span>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                    {selectedReason && (
                        <Textarea
                            placeholder={selectedReason === "other_violation" ? "Berikan detail lebih lanjut tentang alasan Anda melaporkan..." : "Detail opsional (misalnya, timestamp, konteks)..."}
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="mt-2"
                            rows={selectedReason === "other_violation" ? 4 : 2}
                            disabled={isSubmitting}
                        />
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Batal
                    </Button>
                    <Button type="button" onClick={handleReportSubmit} disabled={isSubmitting || !selectedReason}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Mengirim...
                            </>
                        ) : (
                            <>
                                <Flag className="mr-2 h-4 w-4" />
                                Kirim Laporan
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}