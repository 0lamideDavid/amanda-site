import { env } from "./config/env";
import { app } from "./app";

app.listen(env.PORT, () => {
  console.log(`Amanda's site listening on http://localhost:${env.PORT}`);
});
