"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
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
import { Edit, MapPin, Phone, Github, Twitter, Linkedin, Instagram, Calendar, Mail, Loader2, Link, UserRoundPen } from "lucide-react";
import type { User } from "@/types/types";
import { ImageUploader } from "@/components/imagekit/ImageUploader";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- SKEMA VALIDASI DENGAN ZOD ---
const profileFormSchema = z.object({
    username: z.string().min(2, {
        message: "Nama pengguna harus setidaknya 2 karakter.",
    }).max(50, {
        message: "Nama pengguna tidak boleh lebih dari 50 karakter.",
    }),
    bio: z.string().max(160, {
        message: "Bio tidak boleh lebih dari 160 karakter.",
    }).optional().or(z.literal("")),
    location: z.string().max(50, {
        message: "Lokasi tidak boleh lebih dari 50 karakter.",
    }).optional().or(z.literal("")),
    phone: z.string().min(10, {
        message: "Nomor telepon harus setidaknya 10 digit.",
    }).max(15, {
        message: "Nomor telepon tidak boleh lebih dari 15 digit.",
    }).optional().or(z.literal("")),
    website: z.string().url({
        message: "Website harus berupa URL yang valid."
    }).optional().or(z.literal("")),
    github: z.string().max(39, {
        message: "Username GitHub tidak boleh lebih dari 39 karakter."
    }).optional().or(z.literal("")),
    twitter: z.string().max(15, {
        message: "Username Twitter tidak boleh lebih dari 15 karakter."
    }).optional().or(z.literal("")),
    linkedin: z.string().max(30, {
        message: "Username LinkedIn tidak boleh lebih dari 30 karakter."
    }).optional().or(z.literal("")),
    instagram: z.string().max(30, {
        message: "Username Instagram tidak boleh lebih dari 30 karakter."
    }).optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        mode: "onChange",
        defaultValues: {
            username: "",
            bio: "",
            location: "",
            phone: "",
            website: "",
            github: "",
            twitter: "",
            linkedin: "",
            instagram: ""
        }
    });

    const fetchUserData = useCallback(async (userId: string) => {
        try {
            const response = await fetch(`/api/users/${userId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Gagal memuat data pengguna.");
            }
            const fetchedUser: User = await response.json();
            setUser(fetchedUser);
            form.reset({
                username: fetchedUser.username || "",
                bio: fetchedUser.bio || "",
                location: fetchedUser.location || "",
                phone: fetchedUser.phone || "",
                website: fetchedUser.website || "",
                github: fetchedUser.github || "",
                twitter: fetchedUser.twitter || "",
                linkedin: fetchedUser.linkedin || "",
                instagram: fetchedUser.instagram || "",
            });
            toast.success("Data profil berhasil dimuat.");
        } catch (error) {
            console.error("Error fetching user data:", error);
            toast.error(error instanceof Error ? error.message : "Gagal memuat profil.");
            setUser(null);
        } finally {
            setInitialLoading(false);
        }
    }, [form]);

    useEffect(() => {
        if (status === "loading") return;

        if (status === "unauthenticated") {
            router.push('/login');
            return;
        }

        if (session?.user?.id && initialLoading) {
            fetchUserData(session.user.id);
        }
    }, [status, session, router, fetchUserData, initialLoading]);

    const formatDate = (dateString: string): string => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const handleSaveProfile = async (data: ProfileFormValues) => {
        if (!user) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/users/${user.id}/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Gagal memperbarui profil.");
            }

            setUser(prevUser => ({ ...prevUser!, ...data }));
            setIsEditing(false);
            toast.success("Profil berhasil diperbarui!");
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error(error instanceof Error ? error.message : "Gagal menyimpan perubahan profil.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        form.reset({
            username: user?.username || "",
            bio: user?.bio || "",
            location: user?.location || "",
            phone: user?.phone || "",
            website: user?.website || "",
            github: user?.github || "",
            twitter: user?.twitter || "",
            linkedin: user?.linkedin || "",
            instagram: user?.instagram || "",
        });
        setIsEditing(false);
    };

    const handleAvatarUrlChange = useCallback(async (newUrl: string | null) => {
        if (!user) return;
        try {
            const response = await fetch(`/api/users/${user.id}/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatar: newUrl || "" }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Gagal memperbarui avatar.");
            }
            setUser(prevUser => ({ ...prevUser!, avatar: newUrl || "" }));
            toast.success("Avatar berhasil diperbarui!");
        } catch (error) {
            console.error("Error updating avatar:", error);
            toast.error(error instanceof Error ? error.message : "Gagal memperbarui avatar.");
        }
    }, [user]);

    const handleBannerUrlChange = useCallback(async (newUrl: string | null) => {
        if (!user) return;
        try {
            const response = await fetch(`/api/users/${user.id}/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ banner: newUrl || "" }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Gagal memperbarui banner.");
            }
            setUser(prevUser => ({ ...prevUser!, banner: newUrl || "" }));
            toast.success("Banner berhasil diperbarui!");
        } catch (error) {
            console.error("Error updating banner:", error);
            toast.error(error instanceof Error ? error.message : "Gagal memperbarui banner.");
        }
    }, [user]);

    if (initialLoading || status === "loading") {
        return (
            <div className="mx-2 md:mx-4 py-6 space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-800 rounded-t-lg"></div>
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

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-xl text-muted-foreground">Profil tidak ditemukan. Silakan login kembali.</p>
            </div>
        );
    }

    return (
        <div className="mx-2 md:mx-4 py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <UserRoundPen className="h-14 w-14 mr-4" />
                    <div>
                        <h1 className="text-3xl font-bold">Profil Saya</h1>
                        <p className="text-muted-foreground text-xs md:text-xl">Kelola informasi profil Anda. Tampilkan identitas dan aktivitas Anda.</p>
                    </div>
                </div>
                {session?.user?.id === user.id && (
                    <Button onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profil
                    </Button>
                )}
            </div>

            <Card className="py-0">
                <CardContent className="p-0">
                    <div className="relative">
                        <ImageUploader
                            userId={user.id}
                            currentImageUrl={user.banner}
                            onImageUrlChange={handleBannerUrlChange}
                            folderPath="user-banners"
                            fileNamePrefix="banner"
                            imageAlt={`${user.username}'s banner`}
                            disabled={!session?.user?.id || session.user.id !== user.id}
                            type="banner"
                        />
                        <div className="absolute -bottom-16 left-6">
                            <ImageUploader
                                userId={user.id}
                                currentImageUrl={user.avatar}
                                onImageUrlChange={handleAvatarUrlChange}
                                folderPath="user-avatars"
                                fileNamePrefix="avatar"
                                imageAlt={`${user.username}'s avatar`}
                                disabled={!session?.user?.id || session.user.id !== user.id}
                                type="avatar"
                            />
                        </div>
                    </div>
                    <div className="pt-20 pb-6 px-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">{user.username}</h2>
                                <p className="text-muted-foreground flex items-center">
                                    <Mail className="h-4 w-4 mr-2" />
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

            {session?.user?.id === user.id && (
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit Profil</DialogTitle>
                            <DialogDescription>Perbarui informasi profil Anda di sini</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={form.handleSubmit(handleSaveProfile)}>
                            <ScrollArea className="h-[70vh] pr-6">
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="username">Username</Label>
                                            <Input
                                                id="username"
                                                placeholder="Username"
                                                disabled={isSaving}
                                                {...form.register("username")}
                                            />
                                            {form.formState.errors.username && (
                                                <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={user.email || ''}
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
                                            rows={3}
                                            disabled={isSaving}
                                            {...form.register("bio")}
                                        />
                                        {form.formState.errors.bio && (
                                            <p className="text-sm text-red-500">{form.formState.errors.bio.message}</p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="location">Lokasi</Label>
                                            <Input
                                                id="location"
                                                placeholder="Kota, Negara"
                                                disabled={isSaving}
                                                {...form.register("location")}
                                            />
                                            {form.formState.errors.location && (
                                                <p className="text-sm text-red-500">{form.formState.errors.location.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Telepon</Label>
                                            <Input
                                                id="phone"
                                                placeholder="+62 xxx-xxxx-xxxx"
                                                disabled={isSaving}
                                                {...form.register("phone")}
                                            />
                                            {form.formState.errors.phone && (
                                                <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="website">Website</Label>
                                        <Input
                                            id="website"
                                            placeholder="https://example.com"
                                            disabled={isSaving}
                                            {...form.register("website")}
                                        />
                                        {form.formState.errors.website && (
                                            <p className="text-sm text-red-500">{form.formState.errors.website.message}</p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="github">GitHub</Label>
                                            <Input
                                                id="github"
                                                placeholder="username"
                                                disabled={isSaving}
                                                {...form.register("github")}
                                            />
                                            {form.formState.errors.github && (
                                                <p className="text-sm text-red-500">{form.formState.errors.github.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="twitter">Twitter</Label>
                                            <Input
                                                id="twitter"
                                                placeholder="username"
                                                disabled={isSaving}
                                                {...form.register("twitter")}
                                            />
                                            {form.formState.errors.twitter && (
                                                <p className="text-sm text-red-500">{form.formState.errors.twitter.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="linkedin">LinkedIn</Label>
                                            <Input
                                                id="linkedin"
                                                placeholder="username"
                                                disabled={isSaving}
                                                {...form.register("linkedin")}
                                            />
                                            {form.formState.errors.linkedin && (
                                                <p className="text-sm text-red-500">{form.formState.errors.linkedin.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="instagram">Instagram</Label>
                                            <Input
                                                id="instagram"
                                                placeholder="username"
                                                disabled={isSaving}
                                                {...form.register("instagram")}
                                            />
                                            {form.formState.errors.instagram && (
                                                <p className="text-sm text-red-500">{form.formState.errors.instagram.message}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSaving}>
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
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}