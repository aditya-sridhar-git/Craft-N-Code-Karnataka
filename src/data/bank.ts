import type { Distractor } from "@/lib/questions/mcq";

/** Hand-written conceptual questions. Distractors are tagged with the misconception they reveal. */
export interface BankItem {
  id: string;
  skillId: string;
  prompt: string;
  correct: string;
  distractors: Distractor[];
  explanation: string;
}

const d = (text: string, misconceptionId: string | null = null): Distractor => ({ text, misconceptionId });

export const BANK: BankItem[] = [
  // Fractions & ratio
  {
    id: "pizza",
    skillId: "fractions",
    prompt: "Asha ate $\\frac{1}{4}$ of a pizza and Ravi ate $\\frac{1}{3}$ of an identical pizza. Who ate more?",
    correct: "Ravi",
    distractors: [d("Asha, because 4 is bigger than 3", "bigger-denominator"), d("They ate the same amount"), d("You can't tell without knowing the size of the pizza")],
    explanation: "Cutting a pizza into 3 pieces gives bigger pieces than cutting it into 4, so $\\frac{1}{3} > \\frac{1}{4}$ and Ravi ate more.",
  },
  {
    id: "map-scale",
    skillId: "ratio",
    prompt: "A map has the scale 1 : 50 000. Two towns are 4 cm apart on the map. How far apart are they really?",
    correct: "2 km",
    distractors: [d("50 004 cm", "additive-reasoning"), d("200 m"), d("12 500 cm")],
    explanation: "Every 1 cm on the map is 50 000 cm in real life, so 4 cm is $4 \\times 50\\,000 = 200\\,000$ cm $= 2$ km.",
  },
  {
    id: "which-inverse",
    skillId: "direct-inverse",
    prompt: "Which pair of quantities is in inverse proportion?",
    correct: "The speed of a car and the time it takes to cover a fixed distance",
    distractors: [
      d("The number of pens bought and their total cost", "direct-inverse-mixup"),
      d("The distance travelled at a steady speed and the time taken", "direct-inverse-mixup"),
      d("The length of a cloth and its price", "direct-inverse-mixup"),
    ],
    explanation: "If the speed doubles, the time for a fixed distance halves: speed × time stays the same. The other pairs grow together, which is direct proportion.",
  },

  // Algebra
  {
    id: "zero-product",
    skillId: "quadratics",
    prompt: "If $(x - 3)(x + 5) = 0$, what can you conclude?",
    correct: "$x = 3$ or $x = -5$",
    distractors: [d("$x = -3$ or $x = 5$", "root-sign"), d("$x = 3$ only", "one-root-only"), d("$x = 3$ and $x = -5$ at the same time")],
    explanation: "A product is zero only when one of the factors is zero. $x - 3 = 0$ gives $x = 3$; $x + 5 = 0$ gives $x = -5$.",
  },

  // Trigonometry
  {
    id: "sine-less-than-one",
    skillId: "trig-ratios",
    prompt: "For an acute angle $\\theta$ in a right triangle, which statement about $\\sin\\theta$ is always true?",
    correct: "It is less than 1",
    distractors: [
      d("It can be more than 1 if the triangle is big", "ratio-inverted"),
      d("It is equal to $\\cos\\theta$", "sin-cos-swap"),
      d("It depends on the units of length used"),
    ],
    explanation: "$\\sin\\theta = \\frac{\\text{opposite}}{\\text{hypotenuse}}$, and the hypotenuse is the longest side, so the ratio is less than 1. It depends only on the angle, not the size of the triangle.",
  },
  {
    id: "double-30",
    skillId: "standard-angles",
    prompt: "Is $2\\sin 30^\\circ$ equal to $\\sin 60^\\circ$?",
    correct: "No: $2\\sin 30^\\circ = 1$, but $\\sin 60^\\circ = \\frac{\\sqrt{3}}{2}$",
    distractors: [
      d("Yes, doubling the angle doubles the sine", "linear-angles"),
      d("Yes, both equal $\\sqrt{3}$", "linear-angles"),
      d("Only for angles less than $45^\\circ$"),
    ],
    explanation: "$\\sin 30^\\circ = \\frac{1}{2}$, so $2\\sin 30^\\circ = 1$, while $\\sin 60^\\circ = \\frac{\\sqrt{3}}{2} \\approx 0.87$. Trig values are not proportional to the angle.",
  },
  {
    id: "elevation-where",
    skillId: "heights-distances",
    prompt: "Where is the angle of elevation of the top of a tower measured?",
    correct: "At the observer's eye, between the horizontal and the line of sight to the top",
    distractors: [
      d("At the top of the tower, between the tower and the line of sight", "angle-at-wrong-vertex"),
      d("At the foot of the tower, between the tower and the ground", "angle-at-wrong-vertex"),
      d("Between the tower and the observer's shadow"),
    ],
    explanation: "Angles of elevation and depression are always measured at the observer, from the horizontal. Looking up gives elevation; looking down gives depression.",
  },
  {
    id: "walk-closer",
    skillId: "heights-distances",
    prompt: "As you walk towards a tower, what happens to the angle of elevation of its top?",
    correct: "It increases",
    distractors: [d("It decreases"), d("It stays the same, because the tower doesn't change", "angle-at-wrong-vertex"), d("It becomes $90^\\circ$ straight away")],
    explanation: "$\\tan\\theta = \\frac{\\text{height}}{\\text{distance}}$. The height is fixed, so a smaller distance gives a bigger $\\tan\\theta$ and a bigger angle.",
  },

  // Motion
  {
    id: "lap",
    skillId: "velocity",
    prompt: "A runner completes exactly one lap of a 400 m track in 80 s. What is the runner's average velocity for the lap?",
    correct: "0 m/s, because the runner ends where they started",
    distractors: [d("5 m/s", "velocity-is-speed"), d("400 m/s", "distance-is-displacement"), d("You can't tell without the runner's top speed")],
    explanation: "Average velocity = displacement ÷ time. After one lap the displacement is 0, so the average velocity is 0. The average *speed* is $\\frac{400}{80} = 5$ m/s.",
  },
  {
    id: "which-vector",
    skillId: "velocity",
    prompt: "Which of these quantities is a vector?",
    correct: "Velocity",
    distractors: [d("Speed", "velocity-is-speed"), d("Distance", "distance-is-displacement"), d("Time")],
    explanation: "A vector has a direction. Velocity does (\"20 m/s north\"); speed, distance and time do not.",
  },
  {
    id: "east-west",
    skillId: "velocity",
    prompt: "A car drives 3 km east and then 3 km back west. What are the distance travelled and the displacement?",
    correct: "Distance 6 km, displacement 0 km",
    distractors: [
      d("Distance 6 km, displacement 6 km", "distance-is-displacement"),
      d("Distance 0 km, displacement 6 km", "distance-is-displacement"),
      d("Both are 0 km"),
    ],
    explanation: "Distance adds up the whole path: 3 + 3 = 6 km. Displacement is the change in position from start to finish, and the car ends where it started: 0 km.",
  },
  {
    id: "top-of-throw",
    skillId: "acceleration",
    prompt: "A ball is thrown straight up. At the very top of its path, what is its acceleration? (Ignore air resistance.)",
    correct: "$g$ (about 9.8 m/s²), downward",
    distractors: [d("Zero, because it stops for an instant", "zero-at-top"), d("$g$, upward"), d("It can't be found, because it is changing direction", "zero-at-top")],
    explanation: "Gravity acts all the time, so the acceleration is $g$ downward at every point, including the top. The *velocity* is zero there for an instant, but it is still changing.",
  },
  {
    id: "steady-highway",
    skillId: "acceleration",
    prompt: "A car moves at a steady 80 km/h along a straight highway. What is its acceleration?",
    correct: "Zero",
    distractors: [d("Large, because it is moving fast", "acceleration-is-speed"), d("80 km/h", "acceleration-is-speed"), d("You can't tell without knowing its mass")],
    explanation: "Acceleration is the rate of change of velocity. A steady speed in a straight line means the velocity isn't changing, so the acceleration is zero.",
  },
  {
    id: "two-cars",
    skillId: "acceleration",
    prompt: "Car A speeds up from 0 to 50 m/s in 25 s. Car B speeds up from 10 to 20 m/s in 2 s. Which has the greater acceleration?",
    correct: "Car B",
    distractors: [d("Car A, because it reaches a higher speed", "acceleration-is-speed"), d("Both are the same"), d("Car A, because it accelerates for longer")],
    explanation: "Car A: $\\frac{50 - 0}{25} = 2$ m/s². Car B: $\\frac{20 - 10}{2} = 5$ m/s². Acceleration is about how *fast* the velocity changes, not how high it gets.",
  },
  {
    id: "vector-pairs",
    skillId: "vectors",
    prompt: "Which pair contains only vector quantities?",
    correct: "Force and displacement",
    distractors: [d("Mass and velocity", "scalar-vector"), d("Speed and time", "scalar-vector"), d("Distance and force", "scalar-vector")],
    explanation: "Force and displacement both have a direction. Mass, speed, time and distance are scalars.",
  },
  {
    id: "cancel",
    skillId: "vectors",
    prompt: "Can a 5 N force and another 5 N force add up to zero?",
    correct: "Yes, if they point in opposite directions",
    distractors: [d("No, two 5 N forces always add up to 10 N", "add-magnitudes"), d("Only if both forces are zero"), d("Yes, if they are at right angles", "add-magnitudes")],
    explanation: "Vectors add with direction. Equal and opposite forces cancel exactly; at right angles they would give $\\sqrt{5^2 + 5^2} \\approx 7.1$ N.",
  },
  {
    id: "steeper",
    skillId: "components",
    prompt: "A force $F$ acts at an angle $\\theta$ above the horizontal. As $\\theta$ increases from $0^\\circ$ to $90^\\circ$, what happens to its horizontal component?",
    correct: "It decreases to zero",
    distractors: [d("It increases to $F$", "component-swap"), d("It stays equal to $F$"), d("It becomes bigger than $F$", "component-divide")],
    explanation: "The horizontal component is $F\\cos\\theta$. $\\cos 0^\\circ = 1$ and $\\cos 90^\\circ = 0$, so it shrinks from $F$ to 0 as the force tilts upward.",
  },
  {
    id: "component-size",
    skillId: "components",
    prompt: "Which is always true for a vector and its two perpendicular components?",
    correct: "Each component is no bigger than the vector",
    distractors: [
      d("The two components add up to the vector's size", "component-sum"),
      d("A component can be bigger than the vector", "component-divide"),
      d("The two components are always equal"),
    ],
    explanation: "The vector is the hypotenuse of a right triangle whose sides are the components, so each component is at most as big as the vector, and $F_x^2 + F_y^2 = F^2$.",
  },
  {
    id: "top-velocity",
    skillId: "projectile",
    prompt: "A ball is thrown at an angle above the horizontal. At its highest point, its velocity is…",
    correct: "horizontal, equal to $u\\cos\\theta$",
    distractors: [d("zero", "zero-velocity-top"), d("vertical, pointing downward"), d("equal to the launch speed $u$", "horizontal-slows")],
    explanation: "At the top the vertical velocity is zero, but the horizontal velocity $u\\cos\\theta$ never changes. So the ball is moving sideways at $u\\cos\\theta$.",
  },
  {
    id: "horizontal-constant",
    skillId: "projectile",
    prompt: "Ignoring air resistance, what happens to a projectile's horizontal velocity during its flight?",
    correct: "It stays constant",
    distractors: [d("It decreases until the projectile lands", "horizontal-slows"), d("It increases as the projectile falls", "horizontal-slows"), d("It becomes zero at the top", "zero-velocity-top")],
    explanation: "Gravity acts only vertically. With no air resistance, there is no horizontal force, so the horizontal velocity doesn't change.",
  },
  {
    id: "table-edge",
    skillId: "projectile",
    prompt: "Two balls roll off the same table edge at the same moment, one fast and one slow. Which lands first? (Ignore air resistance.)",
    correct: "Both land at the same time",
    distractors: [d("The fast one", "full-speed-vertical"), d("The slow one", "horizontal-slows"), d("The heavier one", "heavier-faster")],
    explanation: "Both start with zero vertical velocity and fall the same height with the same acceleration $g$. Horizontal speed doesn't affect the fall, so they land together; the fast one just lands farther away.",
  },
  {
    id: "heavy-light",
    skillId: "projectile",
    prompt: "A heavy ball and a light ball are launched with the same velocity at the same angle. Which travels farther? (Ignore air resistance.)",
    correct: "Both travel the same distance",
    distractors: [d("The heavy ball", "heavier-faster"), d("The light ball", "heavier-faster"), d("It depends on which one is thrown first")],
    explanation: "Without air resistance the motion depends only on the launch velocity and $g$, which is the same for every object. Mass doesn't appear in the range formula.",
  },

  // Electricity
  {
    id: "two-bulbs",
    skillId: "current",
    prompt: "A battery is connected to two bulbs in series. How does the current through the second bulb compare with the current through the first?",
    correct: "It is the same",
    distractors: [d("It is smaller, because the first bulb uses some of it up", "current-used-up"), d("It is zero", "current-used-up"), d("It is larger")],
    explanation: "Charge isn't lost in a circuit, and a series circuit has only one path, so the same current flows through every component. The bulbs use energy, not current.",
  },
  {
    id: "ammeter-reading",
    skillId: "current",
    prompt: "What does an ammeter reading of 2 A mean?",
    correct: "2 coulombs of charge pass each second",
    distractors: [d("2 joules of energy are used each second"), d("2 volts are pushing the charge"), d("2 coulombs are used up each second", "current-used-up")],
    explanation: "Current is the rate of flow of charge: 1 A = 1 C/s. So 2 A means 2 coulombs flow past every second, and none is used up.",
  },
  {
    id: "voltmeter-where",
    skillId: "voltage",
    prompt: "How should a voltmeter be connected to measure the potential difference across a bulb?",
    correct: "Across the bulb (in parallel with it)",
    distractors: [d("In series with the bulb", "voltage-flows"), d("Anywhere in the circuit, it reads the same", "voltage-flows"), d("Between the battery and the switch")],
    explanation: "Potential difference is the energy difference *between two points*, so the voltmeter connects to both ends of the bulb, in parallel.",
  },
  {
    id: "same-battery",
    skillId: "voltage",
    prompt: "The same 6 V battery is connected first to a 2 Ω resistor and then to a 6 Ω resistor. What happens to the current?",
    correct: "It is larger with the 2 Ω resistor",
    distractors: [
      d("It is the same both times, because the battery is the same", "battery-constant-current"),
      d("It is larger with the 6 Ω resistor"),
      d("It is zero both times"),
    ],
    explanation: "The battery fixes the voltage, not the current. $I = \\frac{V}{R}$: $\\frac{6}{2} = 3$ A versus $\\frac{6}{6} = 1$ A.",
  },
  {
    id: "pd-meaning",
    skillId: "voltage",
    prompt: "Which best describes potential difference?",
    correct: "The energy given to each coulomb of charge",
    distractors: [d("The amount of charge that flows each second", "voltage-flows"), d("The speed of the electrons in the wire"), d("The resistance of the wire", "voltage-is-charge")],
    explanation: "Potential difference is energy per unit charge, $V = \\frac{W}{Q}$. The charge flowing per second is the current.",
  },
  {
    id: "double-voltage",
    skillId: "ohms-law",
    prompt: "The voltage across a resistor is doubled while its resistance stays the same. What happens to the current?",
    correct: "It doubles",
    distractors: [d("It halves", "ohm-rearrange"), d("It stays the same"), d("It becomes four times as big")],
    explanation: "$I = \\frac{V}{R}$. With $R$ fixed, current is directly proportional to voltage, so doubling $V$ doubles $I$.",
  },
  {
    id: "thicker-wire",
    skillId: "ohms-law",
    prompt: "Wires A and B are made of the same metal and have the same length, but wire A is thicker. Which has the greater resistance?",
    correct: "Wire B, the thinner one",
    distractors: [d("Wire A, because it contains more metal", "length-inverse"), d("Both are the same, because they have the same length"), d("You can't tell without the voltage")],
    explanation: "$R = \\rho\\frac{L}{A}$. A thicker wire has a larger cross-sectional area $A$, which gives charge more room to flow, so the thinner wire has more resistance.",
  },
  {
    id: "add-parallel",
    skillId: "circuits",
    prompt: "A second resistor is connected in parallel with an existing one. What happens to the total resistance?",
    correct: "It decreases",
    distractors: [d("It increases", "parallel-bigger"), d("It stays the same"), d("It becomes zero")],
    explanation: "A new parallel branch gives the current an extra path, so more current flows for the same voltage. That means the total resistance has gone down.",
  },
  {
    id: "household",
    skillId: "circuits",
    prompt: "Why are household appliances connected in parallel rather than in series?",
    correct: "Each gets the full mains voltage and can be switched on and off on its own",
    distractors: [
      d("So that the same current flows through all of them", "series-current-splits"),
      d("To make the total resistance larger", "parallel-bigger"),
      d("Because it uses less wire"),
    ],
    explanation: "In parallel each branch gets the full supply voltage, and switching one off doesn't break the others. In series one switch would turn everything off, and each appliance would get only part of the voltage.",
  },

  // Chemistry
  {
    id: "h2o-two",
    skillId: "formulas",
    prompt: "What does the 2 in $\\mathrm{H_2O}$ tell you?",
    correct: "Each water molecule has 2 hydrogen atoms",
    distractors: [d("There are 2 water molecules", "coefficient-subscript"), d("There are 2 oxygen atoms", "subscript-scope"), d("Water is made of 2 elements", "count-elements")],
    explanation: "A subscript counts the atom just before it. $\\mathrm{H_2O}$ has 2 hydrogen atoms and 1 oxygen atom. Two molecules would be written $2\\mathrm{H_2O}$.",
  },
  {
    id: "one-mole",
    skillId: "moles",
    prompt: "One mole of any substance contains…",
    correct: "$6.022 \\times 10^{23}$ particles (atoms, molecules or ions)",
    distractors: [d("$6.022 \\times 10^{23}$ grams", "mole-is-mass"), d("1 gram of the substance", "mole-is-mass"), d("the same mass, whatever the substance", "mole-is-mass")],
    explanation: "A mole is a counting unit, like a dozen: always $6.022 \\times 10^{23}$ particles. Its mass depends on the substance (that's the molar mass).",
  },
  {
    id: "more-molecules",
    skillId: "moles",
    prompt: "Which contains more molecules: 1 mol of $\\mathrm{H_2O}$ (18 g) or 1 mol of $\\mathrm{CO_2}$ (44 g)?",
    correct: "Both contain the same number of molecules",
    distractors: [d("$\\mathrm{CO_2}$, because it is heavier", "mole-is-mass"), d("$\\mathrm{H_2O}$, because its molecules are smaller"), d("You can't tell without the volume")],
    explanation: "Every mole contains $6.022 \\times 10^{23}$ particles. The $\\mathrm{CO_2}$ is heavier because each molecule is heavier, not because there are more of them.",
  },
];
