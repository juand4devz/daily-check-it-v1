"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Edit, Camera, MapPin, Phone, Globe, Github, Twitter, Linkedin, Instagram, Calendar, Mail } from "lucide-react"
import type { User } from "@/types/user"

const mockUser: User = {
    id: "2",
    username: "johndoe",
    email: "john.doe@example.com",
    role: "user",
    loginType: "github",
    avatar: "/placeholder.svg?height=120&width=120",
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
}

export default function ProfilePage() {
    const [user, setUser] = useState<User>(mockUser)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<User>(mockUser)

    const handleSave = () => {
        toast("Simpan Perubahan", {
            description: "Apakah Anda yakin ingin menyimpan perubahan profil?",
            action: {
                label: "Simpan",
                onClick: () => {
                    setUser(editForm)
                    setIsEditing(false)
                    toast.success("Profil berhasil diperbarui")
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => toast.dismiss(),
            },
        })
    }

    const handleCancel = () => {
        setEditForm(user)
        setIsEditing(false)
    }

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    const updateFormField = <K extends keyof User>(field: K, value: User[K]) => {
        setEditForm((prev) => ({ ...prev, [field]: value }))
    }

    return (
        <div className="mx-2 md:mx-4 py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Profil Saya</h1>
                    <p className="text-muted-foreground">Kelola informasi profil dan pengaturan akun Anda</p>
                </div>
                <Button onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profil
                </Button>
            </div>

            <Card className="py-0">
                <CardContent className="p-0">
                    <div className="relative">
                        <div
                            className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg"
                            style={{
                                backgroundImage: `url(${user.banner})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        >
                            <div className="absolute top-4 right-4">
                                <Button variant="secondary" size="sm">
                                    <Camera className="h-4 w-4 mr-2" />
                                    Ubah Banner
                                </Button>
                            </div>
                        </div>

                        <div className="absolute -bottom-16 left-6">
                            <div className="relative">
                                <Avatar className="h-32 w-32 border-4 border-background">
                                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                                    <AvatarFallback className="text-2xl">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <Button variant="secondary" size="sm" className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0">
                                    <Camera className="h-4 w-4" />
                                </Button>
                            </div>
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
                                {user.bio && <p className="mt-2 text-sm">{user.bio}</p>}
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

                        {user.location && (
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Lokasi</p>
                                    <p className="text-sm text-muted-foreground">{user.location}</p>
                                </div>
                            </div>
                        )}

                        {user.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Telepon</p>
                                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                                </div>
                            </div>
                        )}

                        {user.website && (
                            <div className="flex items-center gap-3">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Website</p>
                                    <a
                                        href={user.website}
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
                        {user.github && (
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

                        {user.twitter && (
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

                        {user.linkedin && (
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

                        {user.instagram && (
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

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Profil</DialogTitle>
                        <DialogDescription>Perbarui informasi profil Anda di sini</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={editForm.username}
                                    onChange={(e) => updateFormField("username", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => updateFormField("email", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                placeholder="Ceritakan tentang diri Anda..."
                                value={editForm.bio}
                                onChange={(e) => updateFormField("bio", e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="location">Lokasi</Label>
                                <Input
                                    id="location"
                                    placeholder="Kota, Negara"
                                    value={editForm.location}
                                    onChange={(e) => updateFormField("location", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telepon</Label>
                                <Input
                                    id="phone"
                                    placeholder="+62 xxx-xxxx-xxxx"
                                    value={editForm.phone}
                                    onChange={(e) => updateFormField("phone", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                placeholder="https://example.com"
                                value={editForm.website}
                                onChange={(e) => updateFormField("website", e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="github">GitHub</Label>
                                <Input
                                    id="github"
                                    placeholder="username"
                                    value={editForm.github}
                                    onChange={(e) => updateFormField("github", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="twitter">Twitter</Label>
                                <Input
                                    id="twitter"
                                    placeholder="username"
                                    value={editForm.twitter}
                                    onChange={(e) => updateFormField("twitter", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkedin">LinkedIn</Label>
                                <Input
                                    id="linkedin"
                                    placeholder="username"
                                    value={editForm.linkedin}
                                    onChange={(e) => updateFormField("linkedin", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instagram">Instagram</Label>
                                <Input
                                    id="instagram"
                                    placeholder="username"
                                    value={editForm.instagram}
                                    onChange={(e) => updateFormField("instagram", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancel}>
                            Batal
                        </Button>
                        <Button onClick={handleSave}>Simpan Perubahan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
