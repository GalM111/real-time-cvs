export type JobStatus = "pending" | "processing" | "completed" | "failed";

export type Job = {
    _id: string;
    filename: string;
    status: JobStatus;
    totalRows: number;
    processedRows: number;
    successCount: number;
    failedCount: number;
    errors?: string[];
    createdAt: string;
    completedAt?: string;
};

export type UploadResponse = { jobId: string };
