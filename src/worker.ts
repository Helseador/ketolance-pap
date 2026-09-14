import { bogotaParts, slotForHour } from "./lib/time";
import { dispatchDueSurveys } from "./lib/survey";

let lastKey = "";

async function tick() {
  const parts = bogotaParts();
  const slot = slotForHour(parts.hour);
  if (!slot || parts.minute > 2) return;
  const key = `${parts.date}-${slot}`;
  if (key === lastKey) return;
  lastKey = key;
  console.log("Enviando encuestas", key);
  const result = await dispatchDueSurveys();
  console.log(JSON.stringify(result, null, 2));
}

console.log("Worker Ketolance PAP (America/Bogota). Ctrl+C para salir.");
void tick();
setInterval(() => {
  void tick();
}, 20_000);
