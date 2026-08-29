import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

// ============================================================
//  EL CORAZON DEL LOOP EN VIVO
//  Un solo cron barre las sesiones "live" cada pocos segundos y
//  el scheduler decide CUAL jurado reacciona (respectando el
//  reactEveryMs de cada profile). Nada mas hace falta para que
//  los agentes opinen solos durante el pitch.
// ============================================================
const crons = cronJobs();

crons.interval(
  "jury-react-loop",
  { seconds: 5 },
  internal.scheduler.tick,
  {},
);

export default crons;
