import { Container, Paper, Snackbar, Alert, Stack, Typography } from "@mui/material";
import { UploadForm } from "./components/UploadForm";
import { JobsTable } from "./components/JobsTable";
import { useJobs } from "./hooks/useJobs";
import { useState } from "react";
import "./app.css";

export default function App() {
  // manual refresh only:
  const { jobs, loading, error, refresh, hasActive } = useJobs();

  //  auto refresh every 2s:
  // const { jobs, loading, error, refresh, hasActive } = useJobs({ pollMs: 2000 });

  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="app">
      <div className="app__bg" />

      <Container maxWidth="md" sx={{ py: 4 }} className="app__container">
        <Stack spacing={3}>
          <Paper variant="outlined" className="card">
            <div className="card__header">
              <div>
                <Typography variant="h4" gutterBottom className="title">
                  Real Time CVS
                </Typography>
                <Typography variant="body2" className="subtitle">
                  Upload a CSV, then refresh to see job progress.
                  {hasActive ? <span className="pill pill--live"> Auto-updating…</span> : null}
                </Typography>
              </div>
              <div className="badge" aria-hidden="true">CSV</div>
            </div>

            <div className="divider" />

            <UploadForm
              onUploaded={(jobId) => {
                setToast(`Uploaded! Job ID: ${jobId}`);
                refresh();
              }}
            />
          </Paper>

          {error && <Alert severity="error">{error}</Alert>}

          {/* Optional: wrap table in a card too if you want consistent look */}
          <Paper variant="outlined" className="card card--table">
            <div className="card__header card__header--tight">
              <Typography variant="h6" className="sectionTitle">Jobs</Typography>
              <Typography variant="body2" className="muted">
                Track progress and refresh on demand.
              </Typography>
            </div>
            <div className="divider" />
            <JobsTable jobs={jobs} loading={loading} onRefresh={refresh} />
          </Paper>
        </Stack>

        <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}>
          <Alert severity="success" onClose={() => setToast(null)}>
            {toast}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
}
