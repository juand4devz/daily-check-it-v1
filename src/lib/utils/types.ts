export interface MediaFileTemp {
    id: string; // Temporary ID for internal tracking, or fileId from ImageKit
    file?: File; // Original file object (only for new uploads)
    preview: string; // Blob URL for client-side preview OR existing URL for uploaded files
    type: "image" | "video";
    markdownPlaceholder: string; // Markdown placeholder for new uploads in content
    uploading: boolean; // Indicates if this specific file is uploading
    progress: number; // Upload progress for this file
    uploadedUrl?: string | undefined; // Final ImageKit URL after upload, or undefined if not uploaded/failed
    isNew: boolean; // Flag to indicate if this is a newly added file vs. existing
}

// Tambahkan DiagnosisData juga di sini jika Anda ingin mengaturnya secara global
export interface DiagnosisData {
    symptoms: string;
    diagnosis: string;
    timestamp: string;
}