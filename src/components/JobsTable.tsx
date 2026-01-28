import {
  Box, Button, Chip, Collapse, LinearProgress, Paper, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, Typography
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import type { Job } from "../types/job";
import { useState } from "react";
import { JobErrors } from "./JobErrors";

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
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Jobs</Typography>
        <Button startIcon={<RefreshIcon />} onClick={props.onRefresh} disabled={props.loading}>
          Refresh
        </Button>
      </Stack>

      {props.loading && <LinearProgress sx={{ mb: 2 }} />}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Filename</TableCell>
            <TableCell>Status</TableCell>
            <TableCell width={260}>Progress</TableCell>
            <TableCell>Success</TableCell>
            <TableCell>Failed</TableCell>
            <TableCell align="right">Details</TableCell>
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
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => setOpen(prev => ({ ...prev, [j._id]: !prev[j._id] }))}
                    >
                      {isOpen ? "Hide" : "Show"}
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
