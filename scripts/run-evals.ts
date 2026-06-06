import dotenv from "dotenv";
import { runEvaluationSuite } from "../src/lib/run-evals";

dotenv.config({ path: ".env.local" });
dotenv.config();

const result = await runEvaluationSuite();
console.log(JSON.stringify(result, null, 2));
