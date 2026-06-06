import dotenv from "dotenv";
import { runIngestion } from "../src/lib/run-ingestion";

dotenv.config({ path: ".env.local" });
dotenv.config();

const result = await runIngestion();
console.log(JSON.stringify(result, null, 2));
