import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Job, JobStatus } from "../types/job";
import { listJobs } from "../api/jobs";
import { API_BASE } from "../api/client";

type JobProgressMessage = {
    jobId: string;
    filename?: string;
    status: JobStatus;
    totalRows: number;
    processedRows: number;
    successCount: number;
    failedCount: number;
    errorCount: number;
    createdAt?: string;
    completedAt?: string;
};

type JobDoneMessage = {
    jobId: string;
    status: JobStatus;
};

const LIVE_STATUSES: JobStatus[] = ["pending", "processing"];

function isActiveStatus(status: JobStatus) {
    return LIVE_STATUSES.includes(status);
}

function buildStreamUrl(jobId: string) {
    const path = `/api/jobs/${jobId}/stream`;
    return API_BASE ? `${API_BASE}${path}` : path;
}

export function useJobs() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const streamsRef = useRef<Map<string, EventSource>>(new Map());
    const reconnectTimers = useRef<Map<string, number>>(new Map());
    const jobsByIdRef = useRef<Map<string, Job>>(new Map());

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listJobs();
            data.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
            setJobs(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load jobs");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        const map = new Map<string, Job>();
        for (const job of jobs) {
            map.set(job._id, job);
        }
        jobsByIdRef.current = map;
    }, [jobs]);

    const cleanupTimer = useCallback((jobId: string) => {
        const timerId = reconnectTimers.current.get(jobId);
        if (timerId) {
            window.clearTimeout(timerId);
            reconnectTimers.current.delete(jobId);
        }
    }, []);

    const closeStream = useCallback((jobId: string) => {
        const existing = streamsRef.current.get(jobId);
        if (existing) {
            existing.close();
            streamsRef.current.delete(jobId);
        }
        cleanupTimer(jobId);
    }, [cleanupTimer]);

    const handleProgress = useCallback((payload: JobProgressMessage) => {
        let inserted = false;
        setJobs((prev) => {
            let found = false;
            const updated = prev.map((job) => {
                if (job._id !== payload.jobId) return job;
                found = true;
                return {
                    ...job,
                    status: payload.status,
                    totalRows: payload.totalRows,
                    processedRows: payload.processedRows,
                    successCount: payload.successCount,
                    failedCount: payload.failedCount,
                    completedAt: payload.completedAt ?? job.completedAt,
                };
            });

            if (!found) {
                inserted = true;
                const fallbackName = payload.filename ?? `Job ${payload.jobId}`;
                const newJob: Job = {
                    _id: payload.jobId,
                    filename: fallbackName,
                    status: payload.status,
                    totalRows: payload.totalRows,
                    processedRows: payload.processedRows,
                    successCount: payload.successCount,
                    failedCount: payload.failedCount,
                    errors: [],
                    createdAt: payload.createdAt ?? new Date().toISOString(),
                    completedAt: payload.completedAt,
                };
                return [newJob, ...prev];
            }

            return updated;
        });

        if (inserted) {
            refresh();
        }
    }, [refresh]);

    const handleDone = useCallback((payload: JobDoneMessage) => {
        setJobs((prev) =>
            prev.map((job) =>
                job._id === payload.jobId ? { ...job, status: payload.status } : job
            )
        );
        closeStream(payload.jobId);
        refresh();
    }, [closeStream, refresh]);

    const ensureStream = useCallback((job: Job) => {
        if (!isActiveStatus(job.status)) {
            closeStream(job._id);
            return;
        }
        if (streamsRef.current.has(job._id)) return;

        const source = new EventSource(buildStreamUrl(job._id));

        source.addEventListener("progress", (event) => {
            try {
                const payload = JSON.parse((event as MessageEvent).data) as JobProgressMessage;
                handleProgress(payload);
            } catch (err) {
                console.warn("Failed to parse progress payload", err);
            }
        });

        source.addEventListener("done", (event) => {
            try {
                const payload = JSON.parse((event as MessageEvent).data) as JobDoneMessage;
                handleDone(payload);
            } catch (err) {
                console.warn("Failed to parse done payload", err);
                refresh();
            }
        });

        source.onerror = () => {
            closeStream(job._id);
            cleanupTimer(job._id);
            const timerId = window.setTimeout(() => {
                reconnectTimers.current.delete(job._id);
                const latest = jobsByIdRef.current.get(job._id);
                if (latest && isActiveStatus(latest.status)) {
                    ensureStream(latest);
                }
            }, 2000);
            reconnectTimers.current.set(job._id, timerId);
        };

        streamsRef.current.set(job._id, source);
    }, [cleanupTimer, closeStream, handleDone, handleProgress, refresh]);

    useEffect(() => {
        const activeJobs = jobs.filter((job) => isActiveStatus(job.status));
        const activeIds = new Set(activeJobs.map((job) => job._id));

        for (const job of activeJobs) {
            ensureStream(job);
        }

        streamsRef.current.forEach((_, jobId) => {
            if (!activeIds.has(jobId)) {
                closeStream(jobId);
            }
        });
    }, [jobs, ensureStream, closeStream]);

    useEffect(() => {
        return () => {
            streamsRef.current.forEach((source) => source.close());
            streamsRef.current.clear();
            reconnectTimers.current.forEach((timerId) => window.clearTimeout(timerId));
            reconnectTimers.current.clear();
        };
    }, []);

    const hasActive = useMemo(
        () => jobs.some((job) => isActiveStatus(job.status)),
        [jobs]
    );

    return { jobs, loading, error, refresh, hasActive };
}
