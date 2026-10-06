import { carats } from '@carats/express';
import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 5173);

app.use(carats());

export default app.listen(port, (error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`Carats listening on http://localhost:${port}`);
});
