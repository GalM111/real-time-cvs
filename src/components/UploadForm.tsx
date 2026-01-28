import { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { uploadCsv } from "../api/jobs";

export function UploadForm(props: { onUploaded: (jobId: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onUpload() {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const { jobId } = await uploadCsv(file);
      props.onUploaded(jobId);
      setFile(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Upload CSV</Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
        <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
          Choose File
          <input
            hidden
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </Button>

        <Typography variant="body2" sx={{ flex: 1 }}>
          {file ? file.name : "No file selected"}
        </Typography>

        <Button
          variant="contained"
          disabled={!file || busy}
          onClick={onUpload}
        >
          {busy ? "Uploading..." : "Upload"}
        </Button>
      </Stack>

      {err && <Typography color="error" sx={{ mt: 1 }}>{err}</Typography>}
    </Box>
  );
}
