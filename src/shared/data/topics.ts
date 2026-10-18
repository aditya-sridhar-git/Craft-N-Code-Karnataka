import type { FeaturedTopic } from "@/shared/types";

export const FEATURED: FeaturedTopic[] = [
  {
    id: "projectile-motion",
    title: "Projectile motion",
    subject: "physics",
    grade: 11,
    targetId: "projectile",
    blurb: "Time of flight, maximum height and range.",
    sampleProblem:
      "A ball is thrown at 20 m/s at 30° above the horizontal. Find the maximum height it reaches and how long it stays in the air. (Take g = 10 m/s².)",
  },
  {
    id: "quadratic-equations",
    title: "Quadratic equations",
    subject: "maths",
    grade: 10,
    targetId: "quadratics",
    blurb: "Solving by factorisation.",
    sampleProblem: "Solve x² − 7x + 12 = 0.",
  },
  {
    id: "heights-and-distances",
    title: "Heights and distances",
    subject: "maths",
    grade: 10,
    targetId: "heights-distances",
    blurb: "Angles of elevation and depression.",
    sampleProblem:
      "From a point 30 m away from the foot of a tower, the angle of elevation of its top is 60°. Find the height of the tower.",
  },
  {
    id: "series-and-parallel",
    title: "Resistors in series and parallel",
    subject: "physics",
    grade: 10,
    targetId: "circuits",
    blurb: "Total resistance and current.",
    sampleProblem: "Resistors of 6 Ω and 3 Ω are connected in parallel across a 12 V battery. Find the current drawn from the battery.",
  },
  {
    id: "mole-concept",
    title: "Mole concept",
    subject: "chemistry",
    grade: 11,
    targetId: "moles",
    blurb: "Mass, moles and number of particles.",
    sampleProblem: "How many molecules are there in 36 g of water?",
  },
];

export const featuredById = (id: string) => FEATURED.find((t) => t.id === id);
