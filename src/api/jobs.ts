import { api } from "./client";
import type { Job, UploadResponse } from "../types/job";

export function listJobs() {
    return api<Job[]>("/api/jobs");
}

export function getJob(id: string) {
    return api<Job>(`/api/jobs/${id}`);
}

export async function uploadCsv(file: File) {
    const form = new FormData();
    form.append("file", file); // make sure backend expects "file"
    return api<UploadResponse>("/api/jobs/upload", { method: "POST", body: form });
}

// Optional bonus endpoint
export async function downloadErrorReport(jobId: string) {
    const BASE = import.meta.env.VITE_API_BASE_URL ?? "";
    const res = await fetch(`${BASE}/api/jobs/${jobId}/error-report`);
    if (!res.ok) throw new Error("Failed to download error report");
    return res.blob();
}
