// /components/user/UserProfileDialog.tsx
"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserProfileContent } from "@/components/user/UserProfileContent";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserProfileDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string; // Menerima userId
}

export function UserProfileDialog({ isOpen, onOpenChange, userId }: UserProfileDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl h-[90vh] flex flex-col p-0" onClick={e => e.stopPropagation()}>
                <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        Profil Pengguna
                    </DialogTitle>
                    <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                        <X className="h-5 w-5" />
                        <span className="sr-only">Tutup</span>
                    </Button>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto p-4">
                    <UserProfileContent userId={userId} onClose={() => onOpenChange(false)} /> {/* Pass userId */}
                </div>
            </DialogContent>
        </Dialog>
    );
}