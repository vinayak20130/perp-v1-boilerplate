import express from 'express';
import { envs } from "./utils/env";
const app = express();
app.use(express.json());

app.listen(envs.port, () => {
  console.log("app is listening on the port", envs.port);
});

