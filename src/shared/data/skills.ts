import type { Skill } from "@/shared/types";

/**
 * The curated prerequisite graph. Each skill lists the skills it builds on (`prereqs`).
 * Misconception ids match the tags on question options, so a wrong answer tells us *why*.
 * Syllabus references give class + topic name only (chapter numbers changed with the new NCERT books).
 */
const LIST: Skill[] = [
  // ───────────── Number foundations ─────────────
  {
    id: "integers",
    title: "Operations on integers",
    short: "Integers",
    subject: "maths",
    grade: 7,
    summary: "Adding, subtracting and multiplying negative numbers.",
    prereqs: [],
    misconceptions: [
      {
        id: "minus-signs",
        label: "Mixes up the rules for minus signs",
        fix: "Subtracting a negative is adding: $5 - (-3) = 5 + 3 = 8$. But $-5 - 3$ just moves further left on the number line, to $-8$. \"Two minuses make a plus\" only applies when they meet directly, as in $-(-3)$.",
      },
      {
        id: "neg-times-neg",
        label: "Thinks a negative times a negative is negative",
        fix: "A negative times a negative is positive. Follow the pattern: $-4 \\times 2 = -8$, $-4 \\times 1 = -4$, $-4 \\times 0 = 0$. Each step goes up by 4, so $-4 \\times (-1) = 4$.",
      },
      {
        id: "sign-of-sum",
        label: "Gets the sign wrong when adding a positive and a negative",
        fix: "When the signs differ, subtract the sizes and keep the sign of the bigger size: $-9 + 4 = -5$ because 9 is bigger than 4 and it was negative.",
      },
    ],
    ref: { cls: 7, topic: "Integers" },
    lesson:
      "Think of a number line. Adding a positive moves right, adding a negative moves left. Subtracting a negative is the same as adding: $7 - (-2) = 9$. When multiplying, same signs give a positive answer and different signs give a negative one: $(-3) \\times (-4) = 12$, $(-3) \\times 4 = -12$.",
  },
  {
    id: "bodmas",
    title: "Order of operations (BODMAS)",
    short: "BODMAS",
    subject: "maths",
    grade: 6,
    summary: "Brackets, then division and multiplication, then addition and subtraction.",
    prereqs: [],
    misconceptions: [
      {
        id: "left-to-right",
        label: "Works strictly left to right, ignoring BODMAS",
        fix: "Multiplication and division come before addition and subtraction: $6 + 4 \\times 2 = 6 + 8 = 14$, not $10 \\times 2 = 20$.",
      },
      {
        id: "add-before-subtract",
        label: "Always adds before subtracting, because A comes before S",
        fix: "Addition and subtraction have equal priority, so go left to right: $10 - 3 + 2 = 7 + 2 = 9$, not $10 - 5 = 5$.",
      },
      {
        id: "multiply-before-divide",
        label: "Always multiplies before dividing",
        fix: "Division and multiplication have equal priority, so go left to right: $24 \\div 2 \\times 3 = 12 \\times 3 = 36$, not $24 \\div 6 = 4$.",
      },
      {
        id: "ignores-brackets",
        label: "Ignores brackets",
        fix: "Brackets always come first: $(2 + 3) \\times 4 = 5 \\times 4 = 20$, but $2 + 3 \\times 4 = 14$.",
      },
    ],
    ref: { cls: 6, topic: "Order of operations (BODMAS)" },
    lesson:
      "BODMAS gives the order: **B**rackets, **O**rders (powers and roots), then **D**ivision and **M**ultiplication *together* from left to right, then **A**ddition and **S**ubtraction *together* from left to right. D and M are equal partners, and so are A and S: $10 - 3 + 2 = 9$.",
  },
  {
    id: "fractions",
    title: "Fractions: meaning and comparison",
    short: "Fractions",
    subject: "maths",
    grade: 6,
    summary: "What a fraction means, equivalent fractions, and comparing fractions.",
    prereqs: [],
    misconceptions: [
      {
        id: "bigger-denominator",
        label: "Thinks a bigger denominator means a bigger fraction",
        fix: "The denominator says how many equal pieces the whole is cut into. More pieces means smaller pieces, so $\\frac{1}{8} < \\frac{1}{5}$.",
      },
      {
        id: "equivalent-add",
        label: "Thinks adding the same number to top and bottom keeps a fraction equal",
        fix: "Equivalent fractions come from *multiplying* the top and bottom by the same number: $\\frac{2}{3} = \\frac{4}{6}$. Adding changes the value: $\\frac{3}{4}$ is bigger than $\\frac{2}{3}$.",
      },
      {
        id: "whole-number-compare",
        label: "Compares the top and bottom numbers instead of the values",
        fix: "Bigger numbers don't mean a bigger fraction. Rewrite with the same denominator: $\\frac{3}{4} = \\frac{6}{8}$, which is more than $\\frac{5}{8}$.",
      },
    ],
    ref: { cls: 6, topic: "Fractions" },
    lesson:
      "A fraction $\\frac{a}{b}$ means: cut a whole into $b$ equal pieces and take $a$ of them. Multiplying the top and bottom by the same number gives an equal fraction ($\\frac{1}{2} = \\frac{3}{6}$). To compare two fractions, rewrite them with the same denominator and compare the tops.",
  },
  {
    id: "fraction-ops",
    title: "Adding, multiplying and dividing fractions",
    short: "Fraction operations",
    subject: "maths",
    grade: 7,
    summary: "Adding with common denominators, multiplying across, and dividing by flipping.",
    prereqs: ["fractions"],
    misconceptions: [
      {
        id: "add-across",
        label: "Adds (or subtracts) the tops and the bottoms separately",
        fix: "To add, first make the denominators equal: $\\frac{1}{2} + \\frac{1}{3} = \\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6}$, not $\\frac{2}{5}$. A quick check: the answer must be bigger than $\\frac{1}{2}$.",
      },
      {
        id: "divide-no-flip",
        label: "Divides fractions without flipping the second one",
        fix: "Dividing by a fraction means multiplying by its reciprocal: $\\frac{2}{3} \\div \\frac{4}{5} = \\frac{2}{3} \\times \\frac{5}{4} = \\frac{10}{12} = \\frac{5}{6}$.",
      },
      {
        id: "flip-wrong",
        label: "Flips the first fraction instead of the second",
        fix: "Only the fraction you divide *by* gets flipped: $\\frac{2}{3} \\div \\frac{4}{5} = \\frac{2}{3} \\times \\frac{5}{4}$. The first fraction stays as it is.",
      },
    ],
    ref: { cls: 7, topic: "Operations on fractions" },
    lesson:
      "**Add or subtract:** make the denominators the same, then add the tops: $\\frac{1}{4} + \\frac{2}{3} = \\frac{3}{12} + \\frac{8}{12} = \\frac{11}{12}$. **Multiply:** tops times tops, bottoms times bottoms. **Divide:** flip the second fraction and multiply.",
  },
  {
    id: "decimals",
    title: "Decimals and place value",
    short: "Decimals",
    subject: "maths",
    grade: 6,
    summary: "Comparing decimals, multiplying them, and converting fractions to decimals.",
    prereqs: ["fractions"],
    misconceptions: [
      {
        id: "longer-is-larger",
        label: "Thinks a decimal with more digits is larger",
        fix: "Compare place by place from the left. $0.5 = 0.50$, and 50 hundredths is more than 45 hundredths, so $0.5 > 0.45$.",
      },
      {
        id: "decimal-places",
        label: "Puts the decimal point in the wrong place after multiplying",
        fix: "Count the decimal places in the question: $0.3 \\times 0.2$ has $1 + 1 = 2$, so the answer has 2: $0.06$.",
      },
      {
        id: "multiply-makes-bigger",
        label: "Thinks multiplying always makes a number bigger",
        fix: "Multiplying by a number less than 1 takes only *part* of it, so the answer gets smaller: $0.8 \\times 0.5 = 0.4$.",
      },
      {
        id: "fraction-as-digits",
        label: "Writes a fraction like $\\frac{3}{4}$ as 3.4 or 0.34",
        fix: "$\\frac{3}{4}$ means $3 \\div 4 = 0.75$. The digits of the fraction are not the digits of the decimal.",
      },
    ],
    ref: { cls: 6, topic: "Decimals" },
    lesson:
      "Each place to the right of the point is ten times smaller: tenths, hundredths, thousandths. To compare decimals, line up the points and compare digit by digit (pad with zeros: $0.5 = 0.50$). A fraction becomes a decimal by dividing: $\\frac{3}{8} = 3 \\div 8 = 0.375$.",
  },
  {
    id: "ratio",
    title: "Ratio and proportion",
    short: "Ratio & proportion",
    subject: "maths",
    grade: 7,
    summary: "Comparing quantities by multiplication, the unitary method and sharing in a ratio.",
    prereqs: ["fractions"],
    misconceptions: [
      {
        id: "additive-reasoning",
        label: "Adds a difference instead of scaling",
        fix: "Proportions scale by multiplying. If 3 pens cost ₹12, one pen costs ₹4, so 5 pens cost ₹20, not ₹12 + 2 = ₹14.",
      },
      {
        id: "ratio-order",
        label: "Takes the parts of a ratio in the wrong order",
        fix: "A ratio keeps the order of the words: \"boys to girls is 2 : 3\" means boys get the 2 parts and girls get the 3 parts.",
      },
      {
        id: "part-whole",
        label: "Confuses part-to-part with part-to-whole",
        fix: "In a 2 : 3 ratio the whole has $2 + 3 = 5$ parts, so the first part is $\\frac{2}{5}$ of the whole, not $\\frac{2}{3}$.",
      },
    ],
    ref: { cls: 6, topic: "Ratio and proportion" },
    lesson:
      "A ratio compares quantities by *multiplication*. The unitary method finds the value of one unit first: if 4 kg cost ₹200, then 1 kg costs ₹50, so 7 kg cost ₹350. To share in the ratio $a : b$, split the total into $a + b$ equal parts.",
  },
  {
    id: "direct-inverse",
    title: "Direct and inverse proportion",
    short: "Direct & inverse",
    subject: "maths",
    grade: 8,
    summary: "Telling apart quantities that grow together from ones that trade off.",
    prereqs: ["ratio"],
    misconceptions: [
      {
        id: "direct-inverse-mixup",
        label: "Mixes up direct and inverse proportion",
        fix: "Ask: if one doubles, does the other double (direct) or halve (inverse)? More workers finish faster, so workers and days are inverse: their product stays the same. 4 workers × 6 days = 24, so 8 workers need 3 days.",
      },
    ],
    ref: { cls: 8, topic: "Direct and inverse proportions" },
    lesson:
      "In **direct** proportion the ratio stays constant ($\\frac{y}{x} = k$): twice the pens, twice the cost. In **inverse** proportion the product stays constant ($xy = k$): twice the speed, half the time. Always decide which kind it is before calculating.",
  },
  {
    id: "exponents",
    title: "Exponents and powers",
    short: "Exponents",
    subject: "maths",
    grade: 7,
    summary: "What powers mean and the laws for multiplying and raising them.",
    prereqs: ["integers"],
    misconceptions: [
      {
        id: "exponent-rules-mixed",
        label: "Mixes up when to add and when to multiply powers",
        fix: "Multiplying powers of the same base adds the exponents: $2^3 \\times 2^4 = 2^7$. A power of a power multiplies them: $(2^3)^4 = 2^{12}$. Write it out if unsure.",
      },
      {
        id: "base-times-power",
        label: "Thinks $a^n$ means $a \\times n$",
        fix: "$3^4$ means four 3s multiplied: $3 \\times 3 \\times 3 \\times 3 = 81$, not $3 \\times 4 = 12$.",
      },
      {
        id: "zero-power",
        label: "Thinks anything to the power 0 is 0",
        fix: "$a^0 = 1$ (for $a \\ne 0$). Because $\\frac{5^3}{5^3} = 5^{3-3} = 5^0$, and anything divided by itself is 1.",
      },
      {
        id: "negative-power",
        label: "Thinks a negative power makes the number negative",
        fix: "A negative power means \"one over\": $2^{-3} = \\frac{1}{2^3} = \\frac{1}{8}$. It is still positive.",
      },
    ],
    ref: { cls: 7, topic: "Exponents and powers" },
    lesson:
      "$a^n$ means $n$ copies of $a$ multiplied together. The laws: $a^m \\times a^n = a^{m+n}$, $\\frac{a^m}{a^n} = a^{m-n}$, $(a^m)^n = a^{mn}$, $a^0 = 1$, and $a^{-n} = \\frac{1}{a^n}$.",
  },
  {
    id: "sci-notation",
    title: "Standard form (scientific notation)",
    short: "Standard form",
    subject: "maths",
    grade: 8,
    summary: "Writing very large and very small numbers as $a \\times 10^n$.",
    prereqs: ["exponents", "decimals"],
    misconceptions: [
      {
        id: "exponent-sign",
        label: "Uses the wrong sign on the power of 10",
        fix: "Numbers smaller than 1 get *negative* powers: $0.00045 = 4.5 \\times 10^{-4}$. Big numbers get positive powers: $45\\,000 = 4.5 \\times 10^{4}$.",
      },
      {
        id: "count-zeros",
        label: "Counts zeros instead of the places the point moves",
        fix: "Count how many places the decimal point moves, not how many zeros you see: $45\\,000 = 4.5 \\times 10^{4}$ (4 places), not $10^3$.",
      },
      {
        id: "power-arithmetic",
        label: "Multiplies the powers of 10 instead of adding them",
        fix: "$(2 \\times 10^3) \\times (3 \\times 10^4) = 6 \\times 10^{3+4} = 6 \\times 10^7$. Powers of 10 multiply by adding their exponents.",
      },
    ],
    ref: { cls: 8, topic: "Exponents and powers (standard form)" },
    lesson:
      "Standard form is $a \\times 10^n$ with $1 \\le a < 10$. Move the decimal point until one non-zero digit is in front; the number of places moved is $n$. Moving left (big numbers) gives a positive $n$, moving right (small numbers) a negative $n$.",
  },

  // ───────────── Algebra ─────────────
  {
    id: "expressions",
    title: "Algebraic expressions",
    short: "Expressions",
    subject: "maths",
    grade: 7,
    summary: "Combining like terms and expanding brackets.",
    prereqs: ["integers", "bodmas"],
    misconceptions: [
      {
        id: "distribute-first-only",
        label: "Multiplies only the first term inside a bracket",
        fix: "The number outside multiplies *everything* inside: $3(x + 4) = 3x + 12$, not $3x + 4$.",
      },
      {
        id: "combine-unlike",
        label: "Combines unlike terms",
        fix: "Only like terms combine. $2x + 3$ can't be simplified, and $2x + 3x^2$ is not $5x^3$: an $x$ and an $x^2$ are different kinds of thing.",
      },
      {
        id: "minus-bracket",
        label: "Forgets to change the signs when removing a bracket after a minus",
        fix: "A minus in front of a bracket multiplies every term by $-1$: $-(x - 3) = -x + 3$.",
      },
    ],
    ref: { cls: 7, topic: "Algebraic expressions" },
    lesson:
      "Like terms have exactly the same letters and powers ($3x$ and $5x$; not $3x$ and $3x^2$), and only like terms can be added. To expand $a(b + c)$, multiply $a$ by every term inside: $ab + ac$. A minus outside flips every sign inside.",
  },
  {
    id: "linear-equations",
    title: "Solving linear equations",
    short: "Linear equations",
    subject: "maths",
    grade: 8,
    summary: "Finding the unknown by doing the same thing to both sides.",
    prereqs: ["expressions", "fraction-ops"],
    misconceptions: [
      {
        id: "transpose-no-sign-change",
        label: "Moves a term across the = sign without changing its sign",
        fix: "\"Transposing\" is really doing the same thing to both sides: $x + 5 = 12 \\Rightarrow x = 12 - 5 = 7$. The $+5$ becomes $-5$.",
      },
      {
        id: "divide-first",
        label: "Divides before removing the constant term",
        fix: "Undo operations in reverse order. For $3x + 5 = 20$: subtract 5 first ($3x = 15$), then divide by 3 ($x = 5$).",
      },
      {
        id: "wrong-inverse",
        label: "Uses the wrong opposite operation (subtracts instead of dividing, or divides instead of multiplying)",
        fix: "$3x$ means 3 times $x$, so undo it by dividing by 3. $\\frac{x}{4}$ means $x$ divided by 4, so undo it by multiplying by 4.",
      },
    ],
    ref: { cls: 8, topic: "Linear equations in one variable" },
    lesson:
      "An equation is a balance: whatever you do to one side, do to the other. Undo the operations around $x$ in reverse order, constants first: $4x - 3 = 13 \\Rightarrow 4x = 16 \\Rightarrow x = 4$. Check by substituting back.",
  },
  {
    id: "rearranging",
    title: "Changing the subject of a formula",
    short: "Rearranging formulas",
    subject: "maths",
    grade: 9,
    summary: "Rearranging formulas like $v = u + at$ to find any letter.",
    prereqs: ["linear-equations"],
    misconceptions: [
      {
        id: "inverse-op-wrong",
        label: "Uses the wrong opposite operation when rearranging",
        fix: "If a letter is multiplied, divide to undo it: $V = IR \\Rightarrow R = \\frac{V}{I}$, not $\\frac{I}{V}$ or $VI$. If it is divided, multiply.",
      },
      {
        id: "partial-undo",
        label: "Undoes the operations in the wrong order, or only partly",
        fix: "Undo in reverse order and apply each step to the *whole* side: $v = u + at \\Rightarrow v - u = at \\Rightarrow a = \\frac{v - u}{t}$, not $\\frac{v}{t} - u$.",
      },
    ],
    ref: { cls: 9, topic: "Rearranging formulas (used across Class 9–11 science)" },
    lesson:
      "Rearranging a formula is solving an equation with letters. Ask what is being done to the letter you want, then undo those operations in reverse order on both sides. For $s = \\frac{1}{2}at^2$: multiply by 2, divide by $a$, then take the square root: $t = \\sqrt{\\frac{2s}{a}}$.",
  },
  {
    id: "identities",
    title: "Algebraic identities",
    short: "Identities",
    subject: "maths",
    grade: 8,
    summary: "$(a + b)^2$, $(a - b)^2$ and $a^2 - b^2$.",
    prereqs: ["expressions", "exponents"],
    misconceptions: [
      {
        id: "square-of-sum",
        label: "Thinks $(a + b)^2 = a^2 + b^2$",
        fix: "$(a + b)^2 = a^2 + 2ab + b^2$. Don't forget the middle term $2ab$. Check with numbers: $(1 + 1)^2 = 4$, but $1^2 + 1^2 = 2$.",
      },
      {
        id: "middle-term-sign",
        label: "Gets the sign of the middle term wrong",
        fix: "$(a - b)^2 = a^2 - 2ab + b^2$: the middle term is negative, the last is positive.",
      },
      {
        id: "diff-squares",
        label: "Writes $a^2 - b^2$ as $(a - b)^2$",
        fix: "$a^2 - b^2 = (a - b)(a + b)$. $(a - b)^2 = a^2 - 2ab + b^2$ is a different expression.",
      },
    ],
    ref: { cls: 8, topic: "Algebraic identities" },
    lesson:
      "Three identities to know: $(a + b)^2 = a^2 + 2ab + b^2$, $(a - b)^2 = a^2 - 2ab + b^2$, and $a^2 - b^2 = (a - b)(a + b)$. They come from expanding brackets: $(a + b)(a + b) = a^2 + ab + ba + b^2$.",
  },
  {
    id: "factorisation",
    title: "Factorising quadratic expressions",
    short: "Factorisation",
    subject: "maths",
    grade: 9,
    summary: "Splitting the middle term to write $x^2 + bx + c$ as two brackets.",
    prereqs: ["identities", "integers"],
    misconceptions: [
      {
        id: "sum-product-swap",
        label: "Mixes up which numbers must add and which must multiply",
        fix: "For $x^2 + bx + c$, find two numbers that MULTIPLY to $c$ and ADD to $b$: $x^2 + 5x + 6 = (x + 2)(x + 3)$ because $2 \\times 3 = 6$ and $2 + 3 = 5$.",
      },
      {
        id: "sign-error-factors",
        label: "Gets the signs inside the brackets wrong",
        fix: "Check by expanding: $(x - 2)(x - 3) = x^2 - 5x + 6$. If $c$ is positive and $b$ is negative, both numbers are negative.",
      },
    ],
    ref: { cls: 9, topic: "Polynomials (factorisation)" },
    lesson:
      "To factorise $x^2 + bx + c$, look for two numbers $p$ and $q$ with $p \\times q = c$ and $p + q = b$. Then $x^2 + bx + c = (x + p)(x + q)$. Always check by expanding back.",
  },
  {
    id: "square-roots",
    title: "Squares and square roots",
    short: "Square roots",
    subject: "maths",
    grade: 8,
    summary: "Finding and estimating square roots.",
    prereqs: ["exponents"],
    misconceptions: [
      {
        id: "root-of-sum",
        label: "Thinks $\\sqrt{a + b} = \\sqrt{a} + \\sqrt{b}$",
        fix: "Square roots don't split over addition: $\\sqrt{9 + 16} = \\sqrt{25} = 5$, not $3 + 4 = 7$. Add first, then take the root.",
      },
      {
        id: "root-halves",
        label: "Thinks the square root is half the number",
        fix: "$\\sqrt{16} = 4$ because $4 \\times 4 = 16$. Half of 16 is 8, and $8 \\times 8 = 64$.",
      },
      {
        id: "decimal-root",
        label: "Puts the decimal point in the wrong place in a root",
        fix: "$\\sqrt{0.09} = 0.3$ because $0.3 \\times 0.3 = 0.09$. Check by squaring your answer.",
      },
    ],
    ref: { cls: 8, topic: "Squares and square roots" },
    lesson:
      "$\\sqrt{n}$ is the number that multiplies by itself to give $n$: $\\sqrt{49} = 7$. To estimate, find the squares on either side: $\\sqrt{50}$ is a little more than 7 because $7^2 = 49$. Roots don't split over addition: $\\sqrt{a^2 + b^2} \\ne a + b$.",
  },
  {
    id: "quadratics",
    title: "Quadratic equations",
    short: "Quadratic equations",
    subject: "maths",
    grade: 10,
    summary: "Solving $ax^2 + bx + c = 0$ by factorising.",
    prereqs: ["factorisation", "square-roots", "linear-equations"],
    misconceptions: [
      {
        id: "root-sign",
        label: "Gets the signs of the roots wrong",
        fix: "If $(x - 2)(x + 3) = 0$, then $x - 2 = 0$ or $x + 3 = 0$, so $x = 2$ or $x = -3$. The sign flips when you solve each bracket.",
      },
      {
        id: "one-root-only",
        label: "Gives only one root",
        fix: "A quadratic usually has two roots. Set *each* factor to zero, and remember $x^2 = 25$ gives $x = 5$ or $x = -5$.",
      },
      {
        id: "divide-by-x",
        label: "Divides both sides by $x$ and loses the root $x = 0$",
        fix: "$x^2 = 5x$: don't divide by $x$ (it might be 0). Rearrange instead: $x^2 - 5x = 0 \\Rightarrow x(x - 5) = 0$, so $x = 0$ or $x = 5$.",
      },
      {
        id: "zero-product-nonzero",
        label: "Uses the zero-product rule when the right side isn't zero",
        fix: "\"Set each bracket to zero\" only works when the product equals zero. For $(x - 1)(x - 2) = 6$, expand and rearrange to $x^2 - 3x - 4 = 0$ first.",
      },
    ],
    ref: { cls: 10, topic: "Quadratic equations" },
    lesson:
      "Get everything on one side so it equals 0, factorise, then use the zero-product rule: if $AB = 0$ then $A = 0$ or $B = 0$. For $x^2 - 5x + 6 = 0$: $(x - 2)(x - 3) = 0$, so $x = 2$ or $x = 3$.",
  },

  // ───────────── Geometry & trigonometry ─────────────
  {
    id: "pythagoras",
    title: "Pythagoras' theorem",
    short: "Pythagoras",
    subject: "maths",
    grade: 7,
    summary: "In a right triangle, $a^2 + b^2 = c^2$.",
    prereqs: ["square-roots"],
    misconceptions: [
      {
        id: "no-square",
        label: "Adds the sides without squaring them",
        fix: "It is the *squares* that add: $a^2 + b^2 = c^2$. For sides 3 and 4: $9 + 16 = 25$, so the hypotenuse is 5, not $3 + 4 = 7$.",
      },
      {
        id: "add-when-leg",
        label: "Adds the squares when finding a shorter side",
        fix: "The hypotenuse is the longest side. To find a shorter side, subtract: $b = \\sqrt{c^2 - a^2}$, e.g. $\\sqrt{13^2 - 5^2} = 12$.",
      },
      {
        id: "hypotenuse-id",
        label: "Doesn't recognise which side is the hypotenuse",
        fix: "The hypotenuse is opposite the right angle. It is the side that doesn't touch the right angle, and it is always the longest.",
      },
    ],
    ref: { cls: 7, topic: "The triangle and its properties (Pythagoras' theorem)" },
    lesson:
      "In a right-angled triangle, the side opposite the right angle is the hypotenuse $c$, and $a^2 + b^2 = c^2$. To find the hypotenuse, add the squares and take the root. To find a shorter side, subtract: $a = \\sqrt{c^2 - b^2}$.",
  },
  {
    id: "trig-ratios",
    title: "Trigonometric ratios",
    short: "Trig ratios",
    subject: "maths",
    grade: 10,
    summary: "$\\sin$, $\\cos$ and $\\tan$ as ratios of sides in a right triangle.",
    prereqs: ["pythagoras", "ratio"],
    misconceptions: [
      {
        id: "sin-cos-swap",
        label: "Swaps sine and cosine",
        fix: "SOH-CAH-TOA: $\\sin\\theta = \\frac{\\text{opposite}}{\\text{hypotenuse}}$ and $\\cos\\theta = \\frac{\\text{adjacent}}{\\text{hypotenuse}}$. The *opposite* side is the one across from the angle; the *adjacent* side touches it.",
      },
      {
        id: "ratio-inverted",
        label: "Writes the ratio upside down",
        fix: "The hypotenuse goes on the *bottom* for sine and cosine, so they are always less than 1 in a right triangle. If your sine is bigger than 1, flip it.",
      },
      {
        id: "wrong-ratio",
        label: "Uses the wrong pair of sides",
        fix: "Match each ratio to its two sides: $\\sin$ uses opposite and hypotenuse, $\\cos$ uses adjacent and hypotenuse, and $\\tan$ uses opposite and adjacent (no hypotenuse).",
      },
    ],
    ref: { cls: 10, topic: "Introduction to trigonometry" },
    lesson:
      "Label the sides from the angle $\\theta$: the **opposite** side faces it, the **adjacent** side touches it, and the **hypotenuse** is opposite the right angle. Then SOH-CAH-TOA: $\\sin\\theta = \\frac{O}{H}$, $\\cos\\theta = \\frac{A}{H}$, $\\tan\\theta = \\frac{O}{A}$.",
  },
  {
    id: "standard-angles",
    title: "Trigonometric values of standard angles",
    short: "Standard angles",
    subject: "maths",
    grade: 10,
    summary: "Exact values of $\\sin$, $\\cos$ and $\\tan$ at $30^\\circ$, $45^\\circ$ and $60^\\circ$.",
    prereqs: ["trig-ratios", "square-roots"],
    misconceptions: [
      {
        id: "sin30-cos30-swap",
        label: "Swaps the values for $30^\\circ$ and $60^\\circ$",
        fix: "$\\sin 30^\\circ = \\frac{1}{2}$ and $\\cos 30^\\circ = \\frac{\\sqrt{3}}{2}$; for $60^\\circ$ they swap: $\\sin 60^\\circ = \\frac{\\sqrt{3}}{2}$, $\\cos 60^\\circ = \\frac{1}{2}$. Sine grows as the angle grows.",
      },
      {
        id: "tan60-inverted",
        label: "Mixes up $\\tan 30^\\circ$ and $\\tan 60^\\circ$",
        fix: "A $60^\\circ$ slope is steep, so $\\tan 60^\\circ = \\sqrt{3}$ (bigger than 1), while $\\tan 30^\\circ = \\frac{1}{\\sqrt{3}}$ (less than 1).",
      },
      {
        id: "linear-angles",
        label: "Thinks doubling the angle doubles the value",
        fix: "Trig values are not proportional to the angle: $\\sin 60^\\circ = \\frac{\\sqrt{3}}{2} \\approx 0.87$, not $2 \\times \\sin 30^\\circ = 1$.",
      },
    ],
    ref: { cls: 10, topic: "Trigonometric ratios of some specific angles" },
    lesson:
      "Two triangles give every value. A $30^\\circ$–$60^\\circ$–$90^\\circ$ triangle has sides $1, \\sqrt{3}, 2$, so $\\sin 30^\\circ = \\frac{1}{2}$, $\\cos 30^\\circ = \\frac{\\sqrt{3}}{2}$, $\\tan 60^\\circ = \\sqrt{3}$. A $45^\\circ$ triangle has sides $1, 1, \\sqrt{2}$, so $\\sin 45^\\circ = \\cos 45^\\circ = \\frac{1}{\\sqrt{2}}$ and $\\tan 45^\\circ = 1$.",
  },
  {
    id: "heights-distances",
    title: "Heights and distances",
    short: "Heights & distances",
    subject: "maths",
    grade: 10,
    summary: "Using angles of elevation and depression to find heights and distances.",
    prereqs: ["trig-ratios", "standard-angles", "rearranging"],
    misconceptions: [
      {
        id: "wrong-ratio-hd",
        label: "Uses sine or cosine where tangent is needed",
        fix: "Height and ground distance are the opposite and adjacent sides, so use $\\tan\\theta = \\frac{\\text{height}}{\\text{distance}}$. Use sine or cosine only when the slanted line of sight is involved.",
      },
      {
        id: "inverted-tan",
        label: "Divides by $\\tan$ when you should multiply (or the reverse)",
        fix: "From $\\tan\\theta = \\frac{h}{d}$: the height is $h = d \\tan\\theta$ and the distance is $d = \\frac{h}{\\tan\\theta}$.",
      },
      {
        id: "angle-at-wrong-vertex",
        label: "Puts the angle of elevation in the wrong place",
        fix: "The angle of elevation is measured at the observer's eye (or the tip of the shadow), between the horizontal ground and the line of sight up to the top.",
      },
    ],
    ref: { cls: 10, topic: "Some applications of trigonometry" },
    lesson:
      "Draw the right triangle first: the object's height is vertical, the ground distance is horizontal, and the angle of elevation sits at the observer, on the ground. Height and distance are opposite and adjacent, so $\\tan\\theta = \\frac{h}{d}$, giving $h = d\\tan\\theta$.",
  },

  // ───────────── Physics: motion ─────────────
  {
    id: "units",
    title: "Units and conversions",
    short: "Units",
    subject: "physics",
    grade: 9,
    summary: "Converting km/h to m/s, prefixes like milli- and kilo-, and area units.",
    prereqs: ["ratio", "sci-notation"],
    misconceptions: [
      {
        id: "kmh-times-36",
        label: "Multiplies by 3.6 when converting km/h to m/s (or divides the other way)",
        fix: "1 km/h = $\\frac{1000 \\text{ m}}{3600 \\text{ s}} = \\frac{5}{18}$ m/s. km/h → m/s: divide by 3.6. m/s → km/h: multiply by 3.6. The km/h number is always the bigger one.",
      },
      {
        id: "prefix-direction",
        label: "Moves the decimal point the wrong way with prefixes",
        fix: "\"milli\" = $10^{-3}$, \"kilo\" = $10^{3}$. Converting to a bigger unit gives a smaller number: 250 mA = 0.25 A, 1500 g = 1.5 kg.",
      },
      {
        id: "area-conversion",
        label: "Converts area units as if they were length units",
        fix: "1 m = 100 cm, so 1 m² = 100 × 100 = 10 000 cm², not 100 cm².",
      },
    ],
    ref: { cls: 11, topic: "Units and measurement" },
    lesson:
      "Convert units by multiplying by a fraction equal to 1, like $\\frac{1000 \\text{ m}}{1 \\text{ km}}$. Prefixes are powers of ten: kilo $= 10^3$, centi $= 10^{-2}$, milli $= 10^{-3}$. Speeds: 1 km/h $= \\frac{5}{18}$ m/s. For areas, square the length conversion.",
  },
  {
    id: "velocity",
    title: "Speed, velocity and displacement",
    short: "Velocity",
    subject: "physics",
    grade: 9,
    summary: "The difference between distance and displacement, and speed and velocity.",
    prereqs: ["units"],
    misconceptions: [
      {
        id: "velocity-is-speed",
        label: "Treats velocity and speed as the same thing",
        fix: "Velocity has a direction and uses displacement. Running one full lap of a track gives displacement 0, so the average velocity is 0, even though the average speed isn't.",
      },
      {
        id: "distance-is-displacement",
        label: "Confuses distance travelled with displacement",
        fix: "Displacement is the straight-line change in position from start to finish, with a direction. Distance is the total length of the path.",
      },
      {
        id: "average-of-speeds",
        label: "Averages two speeds instead of using total distance ÷ total time",
        fix: "Going 60 km/h one way and 40 km/h back over the same road averages 48 km/h, not 50, because more time is spent at the slower speed. Always use total distance ÷ total time.",
      },
      {
        id: "time-units",
        label: "Forgets to convert minutes to hours",
        fix: "For km/h the time must be in hours: 30 minutes is 0.5 h, so 9 km in 30 min is 18 km/h.",
      },
    ],
    ref: { cls: 9, topic: "Motion" },
    lesson:
      "**Distance** is the total path length; **displacement** is the straight-line change in position, with a direction. **Speed** = distance ÷ time; **velocity** = displacement ÷ time (and has a direction). Average speed is always total distance ÷ total time.",
  },
  {
    id: "acceleration",
    title: "Acceleration",
    short: "Acceleration",
    subject: "physics",
    grade: 9,
    summary: "Acceleration as the rate of change of velocity, including its sign.",
    prereqs: ["velocity"],
    misconceptions: [
      {
        id: "zero-at-top",
        label: "Thinks acceleration is zero at the top of a throw",
        fix: "At the top the velocity is zero for an instant, but gravity still pulls: the acceleration is $g \\approx 9.8$ m/s² downward the whole time.",
      },
      {
        id: "acceleration-is-speed",
        label: "Thinks a fast object must have a large acceleration",
        fix: "Acceleration measures how quickly velocity *changes*. A car cruising at a steady 100 km/h in a straight line has zero acceleration.",
      },
      {
        id: "ignores-initial",
        label: "Ignores the starting velocity (uses $\\frac{v}{t}$)",
        fix: "Acceleration uses the *change* in velocity: $a = \\frac{v - u}{t}$. Going from 10 m/s to 30 m/s in 5 s is $\\frac{20}{5} = 4$ m/s², not $\\frac{30}{5}$.",
      },
      {
        id: "sign-ignored",
        label: "Drops the minus sign when an object slows down",
        fix: "Slowing down while moving forward gives a negative acceleration: from 12 m/s to 4 m/s in 4 s is $\\frac{4 - 12}{4} = -2$ m/s².",
      },
    ],
    ref: { cls: 9, topic: "Motion" },
    lesson:
      "Acceleration is the change in velocity per second: $a = \\frac{v - u}{t}$, in m/s². A negative value means it points opposite to the motion (slowing down if moving forward). Under gravity alone, everything accelerates at $g$ downward, even at the top of a throw.",
  },
  {
    id: "motion-equations",
    title: "Equations of motion",
    short: "Equations of motion",
    subject: "physics",
    grade: 9,
    summary: "$v = u + at$, $s = ut + \\frac{1}{2}at^2$ and $v^2 = u^2 + 2as$.",
    prereqs: ["acceleration", "rearranging"],
    misconceptions: [
      {
        id: "forget-half",
        label: "Drops the $\\frac{1}{2}$ (or the 2) in the equations of motion",
        fix: "It's $s = ut + \\frac{1}{2}at^2$ and $v^2 = u^2 + 2as$. Writing out the formula before substituting stops factors going missing.",
      },
      {
        id: "gravity-sign",
        label: "Uses the wrong sign for $g$ when something moves upward",
        fix: "Pick a direction as positive. If up is positive, a thrown ball has $a = -g$: $v = u - gt$, so it slows down on the way up.",
      },
      {
        id: "wrong-equation",
        label: "Uses an equation that doesn't fit the quantities given",
        fix: "List what you know and what you want, then pick the equation that leaves out the quantity you don't know: no time given → $v^2 = u^2 + 2as$.",
      },
    ],
    ref: { cls: 9, topic: "Motion (equations of motion)" },
    lesson:
      "For constant acceleration: $v = u + at$, $s = ut + \\frac{1}{2}at^2$, $v^2 = u^2 + 2as$. Write down the known quantities ($u, v, a, s, t$), pick the equation that skips the unknown you don't need, and keep signs consistent: if up is positive, gravity is $-g$.",
  },
  {
    id: "vectors",
    title: "Vectors and resultants",
    short: "Vectors",
    subject: "physics",
    grade: 11,
    summary: "Vectors have size and direction, and they add with direction in mind.",
    prereqs: ["velocity", "pythagoras"],
    misconceptions: [
      {
        id: "add-magnitudes",
        label: "Adds the sizes of vectors that point in different directions",
        fix: "Vectors at right angles combine with Pythagoras: 3 N east + 4 N north = 5 N, not 7 N. Only vectors in the same direction simply add.",
      },
      {
        id: "scalar-vector",
        label: "Confuses scalars and vectors",
        fix: "A vector needs a direction: velocity, force, displacement, acceleration. A scalar is just a size: speed, distance, mass, time, energy.",
      },
    ],
    ref: { cls: 11, topic: "Motion in a plane (vectors)" },
    lesson:
      "A vector has a size and a direction. Vectors in the same direction add, opposite ones subtract, and perpendicular ones combine with Pythagoras: $R = \\sqrt{A^2 + B^2}$. Speed, distance and mass are scalars; velocity, displacement and force are vectors.",
  },
  {
    id: "components",
    title: "Resolving vectors into components",
    short: "Vector components",
    subject: "physics",
    grade: 11,
    summary: "Splitting a vector into horizontal and vertical parts.",
    prereqs: ["vectors", "trig-ratios", "standard-angles"],
    misconceptions: [
      {
        id: "component-swap",
        label: "Uses $\\sin$ for the horizontal part (angle from the horizontal)",
        fix: "With the angle $\\theta$ measured from the horizontal: horizontal $= F\\cos\\theta$ (adjacent), vertical $= F\\sin\\theta$ (opposite).",
      },
      {
        id: "component-divide",
        label: "Divides by $\\cos$ or $\\sin$ instead of multiplying",
        fix: "A component is never bigger than the vector: $F_x = F\\cos\\theta$, which is at most $F$. Dividing by $\\cos\\theta$ makes it bigger, which is impossible.",
      },
      {
        id: "component-sum",
        label: "Thinks the components add up to the vector's size",
        fix: "Components combine by Pythagoras: $F_x^2 + F_y^2 = F^2$. For a 10 N force with $F_x = 6$ N, $F_y = 8$ N, not 4 N.",
      },
    ],
    ref: { cls: 11, topic: "Motion in a plane (resolution of vectors)" },
    lesson:
      "Draw the vector as the hypotenuse of a right triangle with horizontal and vertical sides. If the angle $\\theta$ is measured from the horizontal, then $F_x = F\\cos\\theta$ and $F_y = F\\sin\\theta$. Each component is smaller than $F$, and $F_x^2 + F_y^2 = F^2$.",
  },
  {
    id: "projectile",
    title: "Projectile motion",
    short: "Projectile motion",
    subject: "physics",
    grade: 11,
    summary: "Objects launched at an angle: time of flight, maximum height and range.",
    prereqs: ["components", "motion-equations"],
    misconceptions: [
      {
        id: "full-speed-vertical",
        label: "Uses the full launch speed (or the wrong component) for the vertical motion",
        fix: "Time in the air and maximum height depend only on the vertical part of the launch velocity, $u\\sin\\theta$. The range uses the horizontal part, $u\\cos\\theta$.",
      },
      {
        id: "zero-velocity-top",
        label: "Thinks the velocity is zero at the highest point",
        fix: "Only the *vertical* velocity is zero at the top. The horizontal velocity $u\\cos\\theta$ keeps going, so the ball is still moving sideways.",
      },
      {
        id: "horizontal-slows",
        label: "Thinks the horizontal velocity changes during flight",
        fix: "Without air resistance nothing pushes or pulls sideways, so the horizontal velocity stays constant. Gravity only changes the vertical velocity.",
      },
      {
        id: "heavier-faster",
        label: "Thinks heavier objects fall faster",
        fix: "Without air resistance every object has the same acceleration $g$, so a heavy and a light ball launched the same way follow the same path.",
      },
    ],
    ref: { cls: 11, topic: "Motion in a plane (projectile motion)" },
    lesson:
      "Treat a projectile as two independent motions. **Horizontally:** constant velocity $u\\cos\\theta$. **Vertically:** constant acceleration $-g$, starting at $u\\sin\\theta$. Time of flight $T = \\frac{2u\\sin\\theta}{g}$, maximum height $H = \\frac{(u\\sin\\theta)^2}{2g}$, range $R = \\frac{u^2\\sin 2\\theta}{g}$.",
  },

  // ───────────── Physics: electricity ─────────────
  {
    id: "current",
    title: "Electric charge and current",
    short: "Current",
    subject: "physics",
    grade: 10,
    summary: "Current as the rate of flow of charge, $I = \\frac{Q}{t}$.",
    prereqs: ["rearranging", "units"],
    misconceptions: [
      {
        id: "current-used-up",
        label: "Thinks current gets used up by a bulb",
        fix: "Charge flows around the whole circuit and none is lost, so in a series circuit the current is the same everywhere. What the bulb uses is *energy*, not current.",
      },
      {
        id: "charge-time-flip",
        label: "Divides the wrong way in $I = \\frac{Q}{t}$",
        fix: "Current is charge per second: $I = \\frac{Q}{t}$. 10 C in 2 s is 5 A. And $Q = It$: 2 A for 30 s moves 60 C.",
      },
    ],
    ref: { cls: 10, topic: "Electricity" },
    lesson:
      "Electric current is the rate at which charge flows: $I = \\frac{Q}{t}$, so 1 ampere = 1 coulomb per second. In a single loop the same current flows through every part, because charge isn't created or destroyed along the way.",
  },
  {
    id: "voltage",
    title: "Potential difference",
    short: "Potential difference",
    subject: "physics",
    grade: 10,
    summary: "Potential difference as energy per unit charge, $V = \\frac{W}{Q}$.",
    prereqs: ["current"],
    misconceptions: [
      {
        id: "voltage-flows",
        label: "Thinks voltage flows through a circuit like current",
        fix: "Potential difference is measured *across* a component (energy per coulomb); current flows *through* it. That's why a voltmeter goes in parallel and an ammeter in series.",
      },
      {
        id: "battery-constant-current",
        label: "Thinks a battery always gives the same current",
        fix: "A battery gives (roughly) a fixed voltage. The current depends on the resistance: $I = \\frac{V}{R}$, so a bigger resistance gives a smaller current.",
      },
      {
        id: "voltage-is-charge",
        label: "Mixes up energy, charge and potential difference",
        fix: "Potential difference is energy per coulomb: $V = \\frac{W}{Q}$. 12 J for 3 C is 4 V, not 36 V.",
      },
    ],
    ref: { cls: 10, topic: "Electricity" },
    lesson:
      "Potential difference (voltage) is the energy given to each coulomb of charge: $V = \\frac{W}{Q}$, so 1 volt = 1 joule per coulomb. It is measured *across* a component with a voltmeter connected in parallel.",
  },
  {
    id: "ohms-law",
    title: "Resistance and Ohm's law",
    short: "Ohm's law",
    subject: "physics",
    grade: 10,
    summary: "$V = IR$ and how length and thickness affect resistance.",
    prereqs: ["voltage", "direct-inverse", "rearranging"],
    misconceptions: [
      {
        id: "ohm-rearrange",
        label: "Rearranges $V = IR$ wrongly",
        fix: "$V = IR$, so $I = \\frac{V}{R}$ and $R = \\frac{V}{I}$. Check: a bigger resistance should give a *smaller* current.",
      },
      {
        id: "length-inverse",
        label: "Gets the effect of length or thickness on resistance backwards",
        fix: "$R = \\rho\\frac{L}{A}$: double the length, double the resistance; double the cross-sectional area (a thicker wire), half the resistance.",
      },
    ],
    ref: { cls: 10, topic: "Electricity (Ohm's law and resistivity)" },
    lesson:
      "Ohm's law: $V = IR$. For a fixed resistance, current is directly proportional to voltage. Resistance depends on the wire: $R = \\rho\\frac{L}{A}$, so longer wires have more resistance and thicker wires have less.",
  },
  {
    id: "circuits",
    title: "Resistors in series and parallel",
    short: "Series & parallel",
    subject: "physics",
    grade: 10,
    summary: "Total resistance and current in series and parallel circuits.",
    prereqs: ["ohms-law", "fraction-ops"],
    misconceptions: [
      {
        id: "parallel-adds",
        label: "Adds resistances that are in parallel",
        fix: "Only series resistances add. In parallel, $\\frac{1}{R} = \\frac{1}{R_1} + \\frac{1}{R_2}$, so the total is *less* than the smallest resistor.",
      },
      {
        id: "forgot-reciprocal",
        label: "Forgets to flip $\\frac{1}{R}$ at the end",
        fix: "After adding $\\frac{1}{R_1} + \\frac{1}{R_2}$ you have $\\frac{1}{R}$, not $R$. Flip it: if $\\frac{1}{R} = \\frac{1}{2}$, then $R = 2$ Ω.",
      },
      {
        id: "series-current-splits",
        label: "Thinks current splits up or gets used up in a series circuit",
        fix: "A series circuit has only one path, so the same current flows through every resistor: $I = \\frac{V}{R_1 + R_2}$.",
      },
      {
        id: "parallel-bigger",
        label: "Thinks adding a parallel branch increases the total resistance",
        fix: "Each new parallel branch gives the current another path, so the total resistance goes *down*.",
      },
    ],
    ref: { cls: 10, topic: "Electricity (resistors in series and parallel)" },
    lesson:
      "**Series:** one path, the same current everywhere, $R = R_1 + R_2 + \\dots$. **Parallel:** several paths, the same voltage across each branch, $\\frac{1}{R} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\dots$. For two in parallel, $R = \\frac{R_1R_2}{R_1 + R_2}$.",
  },

  // ───────────── Chemistry ─────────────
  {
    id: "formulas",
    title: "Atoms, molecules and chemical formulas",
    short: "Chemical formulas",
    subject: "chemistry",
    grade: 9,
    summary: "Reading subscripts, brackets and coefficients in chemical formulas.",
    prereqs: ["bodmas"],
    misconceptions: [
      {
        id: "count-elements",
        label: "Counts kinds of elements instead of atoms",
        fix: "$\\mathrm{H_2SO_4}$ has 3 *elements* (H, S, O) but $2 + 1 + 4 = 7$ *atoms*.",
      },
      {
        id: "subscript-scope",
        label: "Applies a subscript to the wrong atoms",
        fix: "A subscript belongs to the atom just before it, so in $\\mathrm{H_2SO_4}$ the 2 is for H only. After a bracket it multiplies everything inside: $\\mathrm{Ca(OH)_2}$ has 2 O and 2 H.",
      },
      {
        id: "coefficient-subscript",
        label: "Confuses the big number in front with a subscript",
        fix: "$3\\mathrm{H_2O}$ means three separate water molecules: $3 \\times 2 = 6$ H atoms and 3 O atoms in total. Each molecule is still $\\mathrm{H_2O}$.",
      },
    ],
    ref: { cls: 9, topic: "Atoms and molecules" },
    lesson:
      "In a formula, a subscript counts the atom just before it; a subscript after a bracket multiplies everything in the bracket. A number in front (a coefficient) counts whole molecules. So $2\\mathrm{Ca(OH)_2}$ contains 2 Ca, 4 O and 4 H atoms.",
  },
  {
    id: "molar-mass",
    title: "Molecular (molar) mass",
    short: "Molar mass",
    subject: "chemistry",
    grade: 9,
    summary: "Adding up atomic masses to get the mass of one mole.",
    prereqs: ["formulas"],
    misconceptions: [
      {
        id: "ignore-subscript",
        label: "Ignores subscripts when adding atomic masses",
        fix: "Count every atom: $M(\\mathrm{CO_2}) = 12 + 2 \\times 16 = 44$ g/mol, not $12 + 16 = 28$.",
      },
      {
        id: "bracket-multiplier",
        label: "Forgets to multiply everything inside a bracket",
        fix: "$M(\\mathrm{Ca(OH)_2}) = 40 + 2 \\times (16 + 1) = 74$ g/mol. The 2 multiplies both O and H.",
      },
    ],
    ref: { cls: 9, topic: "Atoms and molecules (molecular mass)" },
    lesson:
      "Molar mass = the sum of the atomic masses of every atom in the formula, in g/mol. Multiply each atomic mass by how many of that atom there are: $M(\\mathrm{H_2SO_4}) = 2(1) + 32 + 4(16) = 98$ g/mol.",
  },
  {
    id: "moles",
    title: "Mole concept",
    short: "Mole concept",
    subject: "chemistry",
    grade: 11,
    summary: "Converting between mass, moles and number of particles.",
    prereqs: ["molar-mass", "ratio", "sci-notation"],
    misconceptions: [
      {
        id: "mass-times-molar",
        label: "Multiplies mass by molar mass instead of dividing",
        fix: "$n = \\frac{m}{M}$: 36 g of water ($M = 18$ g/mol) is $\\frac{36}{18} = 2$ mol.",
      },
      {
        id: "molar-over-mass",
        label: "Divides the wrong way (or divides when you should multiply)",
        fix: "Moles = mass ÷ molar mass, and mass = moles × molar mass. Particles = moles × $6.022 \\times 10^{23}$ (multiply, don't divide).",
      },
      {
        id: "avogadro-power",
        label: "Mishandles the power of 10 with Avogadro's number",
        fix: "$2 \\times 6.022 \\times 10^{23} = 12.044 \\times 10^{23} = 1.2044 \\times 10^{24}$. Moving the point one place left adds 1 to the power.",
      },
      {
        id: "mole-is-mass",
        label: "Thinks a mole is a fixed mass rather than a fixed number of particles",
        fix: "A mole is a *number*: $6.022 \\times 10^{23}$ particles, like \"a dozen\" means 12. A mole of water (18 g) and a mole of $\\mathrm{CO_2}$ (44 g) contain the same number of molecules.",
      },
    ],
    ref: { cls: 11, topic: "Some basic concepts of chemistry (mole concept)" },
    lesson:
      "A mole is $6.022 \\times 10^{23}$ particles (Avogadro's number). Its mass in grams equals the molar mass. So: moles $n = \\frac{m}{M}$, mass $m = nM$, and number of particles $N = n \\times 6.022 \\times 10^{23}$.",
  },
];

export const SKILLS: Record<string, Skill> = Object.fromEntries(LIST.map((s) => [s.id, s]));
export const SKILL_LIST: readonly Skill[] = LIST;

export function getSkill(id: string): Skill {
  const s = SKILLS[id];
  if (!s) throw new Error(`Unknown skill ${id}`);
  return s;
}
