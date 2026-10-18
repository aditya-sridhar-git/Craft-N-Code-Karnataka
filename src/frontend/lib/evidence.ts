import sim from "../../../eval/results/simulation.json";

/** Numbers shown in the app come straight from the latest `npm run eval:sim` output. */
export const SIM = sim;
export const pct = (x: number) => `${Math.round(x * 100)}%`;
export const studentsTotal = () => SIM.studentsPerTopic * SIM.topics;
