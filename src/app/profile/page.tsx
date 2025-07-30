// /app/profile/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react"; // Menggunakan useSession untuk mendapatkan ID pengguna yang login
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Edit, Camera, MapPin, Phone, Globe, Github, Twitter, Linkedin, Instagram, Calendar, Mail, Loader2, Link } from "lucide-react";
import type { User } from "@/types/types"; // Pastikan path ini benar
import { ImageUploader } from "@/components/imagekit/ImageUploader";
import { Skeleton } from "@/components/ui/skeleton"; // Untuk efek loading


export default function ProfilePage() {
    const { data: session, status } = useSession(); // Ambil sesi pengguna
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null); // State untuk data user yang ditampilkan
    const [isEditing, setIsEditing] = useState(false); // State untuk mode edit dialog
    const [editForm, setEditForm] = useState<Partial<User>>({}); // State untuk form edit
    const [isSaving, setIsSaving] = useState(false); // State saat proses simpan data
    const [initialLoading, setInitialLoading] = useState(true); // State untuk loading awal page

    // --- Fetch User Data (based on session ID) ---
    const fetchUserData = useCallback(async (userId: string) => {
        try {
            // Fetch data user dari API Route yang sudah ada: /api/users/[id]
            const response = await fetch(`/api/users/${userId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Gagal memuat data pengguna.");
            }
            const fetchedUser: User = await response.json();
            setUser(fetchedUser);
            setEditForm(fetchedUser); // Inisialisasi form edit dengan data yang diambil
            toast.success("Data profil berhasil dimuat.");
        } catch (error) {
            console.error("Error fetching user data:", error);
            toast.error(error instanceof Error ? error.message : "Gagal memuat profil.");
            setUser(null); // Bersihkan data user jika gagal
        } finally {
            setInitialLoading(false); // Selesai loading awal
        }
    }, []);

    useEffect(() => {
        if (status === "loading") return; // Tunggu sesi dimuat

        if (status === "unauthenticated") {
            router.push('/login'); // Redirect ke login jika belum terautentikasi
            return;
        }

        // Jika ada ID pengguna di sesi dan ini adalah loading awal, fetch data
        if (session?.user?.id && initialLoading) {
            fetchUserData(session.user.id);
        }
    }, [status, session, router, fetchUserData, initialLoading]);

    // Fungsi untuk memformat tanggal
    const formatDate = (dateString: string): string => {
        if (!dateString) return "N/A"; // Handle string tanggal kosong
        return new Date(dateString).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // --- Save Profile Changes for Text Fields ---
    const handleSaveProfile = async () => {
        if (!user) return; // Tidak ada user untuk disimpan

        setIsSaving(true);
        try {
            // Kirim hanya field yang diubah atau yang relevan untuk update dari client
            const dataToUpdate: Partial<User> = {
                username: editForm.username,
                bio: editForm.bio,
                location: editForm.location,
                phone: editForm.phone,
                website: editForm.website,
                github: editForm.github,
                twitter: editForm.twitter,
                linkedin: editForm.linkedin,
                instagram: editForm.instagram,
                // avatar dan banner diupdate oleh ImageUploader secara terpisah
            };

            const response = await fetch(`/api/users/${user.id}`, { // Memanggil API update user
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToUpdate),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Gagal memperbarui profil.");
            }

            // Perbarui state user lokal dengan data yang sudah diupdate dari form edit
            // Avatar dan banner akan disinkronkan secara terpisah oleh ImageUploader jika mereka diubah
            setUser(prevUser => ({ ...prevUser!, ...editForm })); // Update state lokal segera
            setIsEditing(false); // Tutup dialog
            toast.success("Profil berhasil diperbarui!");

        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error(error instanceof Error ? error.message : "Gagal menyimpan perubahan profil.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Cancel Edit Dialog ---
    const handleCancelEdit = () => {
        setEditForm(user || {}); // Kembalikan form edit ke data user saat ini
        setIsEditing(false);
    };

    // --- Update Form Field for Dialog ---
    const updateFormField = useCallback(<K extends keyof Partial<User>>(field: K, value: Partial<User>[K]) => {
        setEditForm((prev) => ({ ...prev, [field]: value }));
    }, []);

    // --- Handle Image URL Changes from ImageUploader (untuk Avatar) ---
    const handleAvatarUrlChange = useCallback(async (newUrl: string | null) => {
        if (!user) return;
        try {
            // Kirim perubahan avatar ke API update user
            const response = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatar: newUrl || "" }), // Kirim string kosong jika null untuk hapus
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Gagal memperbarui avatar.");
            }
            setUser(prevUser => ({ ...prevUser!, avatar: newUrl || "" })); // Update state lokal
            toast.success("Avatar berhasil diperbarui!");
        } catch (error) {
            console.error("Error updating avatar:", error);
            toast.error(error instanceof Error ? error.message : "Gagal memperbarui avatar.");
        }
    }, [user]);

    // --- Handle Image URL Changes from ImageUploader (untuk Banner) ---
    const handleBannerUrlChange = useCallback(async (newUrl: string | null) => {
        if (!user) return;
        try {
            // Kirim perubahan banner ke API update user
            const response = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ banner: newUrl || "" }), // Kirim string kosong jika null untuk hapus
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Gagal memperbarui banner.");
            }
            setUser(prevUser => ({ ...prevUser!, banner: newUrl || "" })); // Update state lokal
            toast.success("Banner berhasil diperbarui!");
        } catch (error) {
            console.error("Error updating banner:", error);
            toast.error(error instanceof Error ? error.message : "Gagal memperbarui banner.");
        }
    }, [user]);


    // Tampilkan skeleton saat loading
    if (initialLoading || status === "loading" || !user) {
        return (
            <div className="mx-2 md:mx-4 py-6 space-y-6">
                <Skeleton className="h-8 w-1/3" />
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="relative -mt-16 ml-6">
                    <Skeleton className="h-32 w-32 rounded-full border-4 border-background"></Skeleton>
                </div>
                <div className="pt-20 pb-6 px-6 space-y-2">
                    <Skeleton className="h-8 w-48"></Skeleton>
                    <Skeleton className="h-4 w-64"></Skeleton>
                    <Skeleton className="h-16 w-full"></Skeleton>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Card><CardHeader><Skeleton className="h-6 w-40"></Skeleton></CardHeader><CardContent className="space-y-4"><Skeleton className="h-4 w-full"></Skeleton><Skeleton className="h-4 w-full"></Skeleton></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-40"></Skeleton></CardHeader><CardContent className="space-y-4"><Skeleton className="h-4 w-full"></Skeleton><Skeleton className="h-4 w-full"></Skeleton></CardContent></Card>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-2 md:mx-4 py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Profil Saya</h1>
                    <p className="text-muted-foreground">Kelola informasi profil dan pengaturan akun Anda</p>
                </div>
                {session?.user?.id === user.id && ( // Hanya tampilkan tombol edit jika ini profil pengguna yang login
                    <Button onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profil
                    </Button>
                )}
            </div>

            <Card className="py-0">
                <CardContent className="p-0">
                    <div className="relative">
                        {/* ImageUploader for Banner */}
                        <ImageUploader
                            userId={user.id} // Kirim ID pengguna untuk penamaan file
                            currentImageUrl={user.banner}
                            onImageUrlChange={handleBannerUrlChange}
                            folderPath="user-banners" // Folder di ImageKit
                            fileNamePrefix="banner" // Prefix nama file
                            imageAlt={`${user.username}'s banner`}
                            disabled={!session?.user?.id || session.user.id !== user.id} // Disable jika bukan user yang login
                            type="banner"
                        />
                        <div className="absolute -bottom-16 left-6">
                            {/* ImageUploader for Avatar */}
                            <ImageUploader
                                userId={user.id} // Kirim ID pengguna untuk penamaan file
                                currentImageUrl={user.avatar}
                                onImageUrlChange={handleAvatarUrlChange}
                                folderPath="user-avatars" // Folder di ImageKit
                                fileNamePrefix="avatar" // Prefix nama file
                                imageAlt={`${user.username}'s avatar`}
                                disabled={!session?.user?.id || session.user.id !== user.id} // Disable jika bukan user yang login
                                type="avatar"
                            />
                        </div>
                    </div>

                    <div className="pt-20 pb-6 px-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">{user.username}</h2>
                                <p className="text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    {user.email}
                                </p>
                                {user.bio && user.bio.trim() !== "" && <p className="mt-2 text-sm text-gray-700">{user.bio}</p>}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Dasar</CardTitle>
                        <CardDescription>Informasi dasar tentang akun Anda</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Bergabung</p>
                                <p className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</p>
                            </div>
                        </div>

                        {user.location && user.location.trim() !== "" && (
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Lokasi</p>
                                    <p className="text-sm text-muted-foreground">{user.location}</p>
                                </div>
                            </div>
                        )}

                        {user.phone && user.phone.trim() !== "" && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Telepon</p>
                                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                                </div>
                            </div>
                        )}

                        {user.website && user.website.trim() !== "" && (
                            <div className="flex items-center gap-3">
                                <Link className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Website</p>
                                    <a
                                        href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        {user.website}
                                    </a>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Media Sosial</CardTitle>
                        <CardDescription>Tautan ke profil media sosial Anda</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {user.github && user.github.trim() !== "" && (
                            <div className="flex items-center gap-3">
                                <Github className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">GitHub</p>
                                    <a
                                        href={`https://github.com/${user.github}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        @{user.github}
                                    </a>
                                </div>
                            </div>
                        )}

                        {user.twitter && user.twitter.trim() !== "" && (
                            <div className="flex items-center gap-3">
                                <Twitter className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Twitter</p>
                                    <a
                                        href={`https://twitter.com/${user.twitter}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        @{user.twitter}
                                    </a>
                                </div>
                            </div>
                        )}

                        {user.linkedin && user.linkedin.trim() !== "" && (
                            <div className="flex items-center gap-3">
                                <Linkedin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">LinkedIn</p>
                                    <a
                                        href={`https://linkedin.com/in/${user.linkedin}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        {user.linkedin}
                                    </a>
                                </div>
                            </div>
                        )}

                        {user.instagram && user.instagram.trim() !== "" && (
                            <div className="flex items-center gap-3">
                                <Instagram className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Instagram</p>
                                    <a
                                        href={`https://instagram.com/${user.instagram}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        @{user.instagram}
                                    </a>
                                </div>
                            </div>
                        )}

                        {!user.github && !user.twitter && !user.linkedin && !user.instagram && (
                            <p className="text-sm text-muted-foreground">Belum ada tautan media sosial</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit Profile Dialog */}
            {session?.user?.id === user.id && (
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Profil</DialogTitle>
                            <DialogDescription>Perbarui informasi profil Anda di sini</DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        value={editForm.username || ''}
                                        onChange={(e) => updateFormField("username", e.target.value)}
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={editForm.email || ''}
                                        disabled={true}
                                    />
                                    <p className="text-xs text-muted-foreground">Email tidak dapat diubah.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    placeholder="Ceritakan tentang diri Anda..."
                                    value={editForm.bio || ''}
                                    onChange={(e) => updateFormField("bio", e.target.value)}
                                    rows={3}
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="location">Lokasi</Label>
                                    <Input
                                        id="location"
                                        placeholder="Kota, Negara"
                                        value={editForm.location || ''}
                                        onChange={(e) => updateFormField("location", e.target.value)}
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telepon</Label>
                                    <Input
                                        id="phone"
                                        placeholder="+62 xxx-xxxx-xxxx"
                                        value={editForm.phone || ''}
                                        onChange={(e) => updateFormField("phone", e.target.value)}
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    placeholder="https://example.com"
                                    value={editForm.website || ''}
                                    onChange={(e) => updateFormField("website", e.target.value)}
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="github">GitHub</Label>
                                    <Input
                                        id="github"
                                        placeholder="username"
                                        value={editForm.github || ''}
                                        onChange={(e) => updateFormField("github", e.target.value)}
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="twitter">Twitter</Label>
                                    <Input
                                        id="twitter"
                                        placeholder="username"
                                        value={editForm.twitter || ''}
                                        onChange={(e) => updateFormField("twitter", e.target.value)}
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="linkedin">LinkedIn</Label>
                                    <Input
                                        id="linkedin"
                                        placeholder="username"
                                        value={editForm.linkedin || ''}
                                        onChange={(e) => updateFormField("linkedin", e.target.value)}
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="instagram">Instagram</Label>
                                    <Input
                                        id="instagram"
                                        placeholder="username"
                                        value={editForm.instagram || ''}
                                        onChange={(e) => updateFormField("instagram", e.target.value)}
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                                Batal
                            </Button>
                            <Button onClick={handleSaveProfile} disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    "Simpan Perubahan"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}