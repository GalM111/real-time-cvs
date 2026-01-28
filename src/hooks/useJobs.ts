import { useCallback, useEffect, useMemo, useState } from "react";
import type { Job } from "../types/job";
import { listJobs } from "../api/jobs";

export function useJobs(opts?: { pollMs?: number }) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listJobs();
            // newest first
            data.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
            setJobs(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load jobs");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    useEffect(() => {
        if (!opts?.pollMs) return;
        const id = window.setInterval(refresh, opts.pollMs);
        return () => window.clearInterval(id);
    }, [opts?.pollMs, refresh]);

    const hasActive = useMemo(
        () => jobs.some(j => j.status === "pending" || j.status === "processing"),
        [jobs]
    );

    return { jobs, loading, error, refresh, hasActive };
}
