import {
  Box, Button, Chip, Collapse, LinearProgress, Paper, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, Typography
} from "@mui/material";
import type { Job } from "../types/job";
import { useState } from "react";
import { JobErrors } from "./JobErrors";
import { downloadErrorReport } from "../api/jobs";

function statusColor(status: Job["status"]) {
  switch (status) {
    case "completed": return "success";
    case "failed": return "error";
    case "processing": return "warning";
    default: return "default";
  }
}

export function JobsTable(props: {
  jobs: Job[];
  loading: boolean;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadErr, setDownloadErr] = useState<string | null>(null);

  async function handleDownload(job: Job) {
    if (!job.failedCount) return;

    setDownloadingId(job._id);
    setDownloadErr(null);
    try {
      const blob = await downloadErrorReport(job._id);
      const url = URL.createObjectURL(blob);
      const baseName = job.filename.replace(/\.[^/.]+$/, "") || "job";
      const timestamp = new Date(job.createdAt).toISOString().replace(/[:.]/g, "-");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${baseName}-errors-${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setDownloadErr(e instanceof Error ? e.message : "Failed to download error report");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Jobs</Typography>
        <Chip
          size="small"
          color={props.loading ? "default" : "success"}
          label={props.loading ? "Syncing..." : "Live"}
        />
      </Stack>

      {props.loading && <LinearProgress sx={{ mb: 2 }} />}
      {downloadErr && (
        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
          {downloadErr}
        </Typography>
      )}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Filename</TableCell>
            <TableCell>Status</TableCell>
            <TableCell width={260}>Progress</TableCell>
            <TableCell>Success</TableCell>
            <TableCell>Failed</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {props.jobs.map((j) => {
            const pct = j.totalRows ? Math.round((j.processedRows / j.totalRows) * 100) : 0;
            const isOpen = !!open[j._id];

            return (
              <>
                <TableRow key={j._id}>
                  <TableCell>{j.filename}</TableCell>
                  <TableCell>
                    <Chip size="small" label={j.status} color={statusColor(j.status) as any} />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <LinearProgress variant="determinate" value={pct} />
                      <Typography variant="caption">
                        {j.processedRows}/{j.totalRows} ({pct}%)
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{j.successCount}</TableCell>
                  <TableCell>{j.failedCount}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => handleDownload(j)}
                      disabled={j.failedCount === 0 || downloadingId === j._id}
                    >
                      {downloadingId === j._id ? "Preparing..." : "Download Error Report"}
                    </Button>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 0 }}>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <Box sx={{ py: 2 }}>
                        <Typography variant="body2">
                          Job ID: <b>{j._id}</b>
                        </Typography>
                        <Typography variant="body2">
                          Created: {new Date(j.createdAt).toLocaleString()}
                        </Typography>
                        {j.completedAt && (
                          <Typography variant="body2">
                            Completed: {new Date(j.completedAt).toLocaleString()}
                          </Typography>
                        )}
                        <JobErrors errors={j.errors} />
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </>
            );
          })}

          {!props.jobs.length && !props.loading && (
            <TableRow>
              <TableCell colSpan={6}>
                <Typography variant="body2">No jobs yet. Upload a CSV to start.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}
