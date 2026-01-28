import { Alert, Stack } from "@mui/material";

export function JobErrors({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <Stack spacing={1} sx={{ mt: 1 }}>
      {errors.slice(0, 10).map((e, idx) => (
        <Alert key={idx} severity="error">{e}</Alert>
      ))}
      {errors.length > 10 && <Alert severity="info">Showing first 10 errors…</Alert>}
    </Stack>
  );
}
