import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  generateDatePlannerIdeasFromPlaces,
  type GenerateDatePlannerIdeasRequest,
} from "../shared/datePlannerEngine";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getLatestPlacesFilePath() {
  const dataDir = path.join(__dirname, "data");
  const files = await fs.readdir(dataDir);
  const matches = files
    .filter((file) => /^places_\d{4}-\d{2}-\d{2}(?:_\d+)?\.json$/.test(file))
    .sort((a, b) => a.localeCompare(b));

  if (!matches.length) {
    throw new Error("No places data files found in server/data.");
  }

  return path.join(dataDir, matches[matches.length - 1]);
}

export async function getDatePlannerIdeas(
  params: GenerateDatePlannerIdeasRequest,
) {
  const filePath = await getLatestPlacesFilePath();
  const raw = await fs.readFile(filePath, "utf8");
  const places = JSON.parse(raw);

  return generateDatePlannerIdeasFromPlaces({
    places,
    request: params,
    sourceFile: path.basename(filePath),
  });
}
