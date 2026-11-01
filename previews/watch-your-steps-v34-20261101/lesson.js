(function (root, factory) {
  "use strict";
  const lesson = factory();
  if (typeof module === "object" && module.exports) module.exports = lesson;
  if (root) root.UpstairsLesson = lesson;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }

  const FLIGHTS = freeze([
    {
      id: "whole-small", fromLevel: 1, toLevel: 2,
      title: "Whole numbers climb", sequence: ["1", "3", "5"],
      nextAnswer: "7", step: "2", isIncreasing: true, isTrap: false,
      flintLine: "1, 3, 5 goes up by 2 each time. Next is 7.",
      feedback: "1 < 3 < 5 < 7. Each number is 2 greater than the number before it, so Flint could climb all four steps and reach the upper door."
    },
    {
      id: "decimal-small", fromLevel: 2, toLevel: 3,
      title: "Decimals climb", sequence: ["0.1", "0.3", "0.5"],
      nextAnswer: "0.7", step: "0.2", isIncreasing: true, isTrap: false,
      flintLine: "The parts after the decimal point are 1, 3, 5. Next is 7, so I will enter 0.7.",
      feedback: "0.1 < 0.3 < 0.5 < 0.7. Each number is 0.2 greater than the number before it, so Flint could climb all four steps and reach the upper door."
    },
    {
      id: "whole-nine", fromLevel: 3, toLevel: 4,
      title: "Whole numbers pass 9", sequence: ["7", "9", "11"],
      nextAnswer: "13", step: "2", isIncreasing: true, isTrap: false,
      flintLine: "7, 9, 11 goes up by 2. Next is 13.",
      feedback: "7 < 9 < 11 < 13. Each number is 2 greater than the number before it, so Flint could climb all four steps and reach the upper door."
    },
    {
      id: "decimal-trap", fromLevel: 4, toLevel: 5,
      title: "Specter’s final trap", sequence: ["0.7", "0.9", "0.11"],
      nextAnswer: null, baitAnswer: "0.13", step: null, isIncreasing: false, isTrap: true,
      flintLine: "The parts after the decimal point are 7, 9, 11. Adding 2 gives 13 next, so I will enter 0.13 and keep climbing.",
      feedback: "Trap sprung! The numbers do not keep increasing."
    }
  ]);

  const COPY = freeze({
    mission: "Flint must keep climbing upstairs.",
    introduction: "Specter left a message on the wall: “Catch me upstairs!” Like a regular staircase, each number on a safe route must be greater than the number before it, and the increase must be the same each time. Open the recording to watch Flint climb.",
    recording: "Watch Flint’s recorded attempt.",
    decimalReflection: "Flint looked at the parts after the decimal point—1, 3, 5—and continued that whole-number pattern with 7. So Flint entered 0.7 after 0.1, 0.3, 0.5.\n\nIt seems to have worked this time… but will that rule keep working? Let’s keep watching.",
    trapTitle: "TRAP SPRUNG — THE NUMBERS DO NOT KEEP INCREASING",
    specter: "Ha ha! Counting 7, 9, 11 hid my trap!",
    bellumFreeze: "Freeze the recording! Let’s check the sequence before Flint takes another step.",
    trapExplanation: "The first move increases: 0.7 < 0.9. The next move decreases. Compare the tenths digits: 9 in 0.9 and 1 in 0.11. Since 9 > 1, 0.9 > 0.11. Putting 0.13 at the end cannot change the decrease already shown.",
    pairPrompt: "Which neighboring pair breaks the increasing rule?",
    decisionPrompt: "The route still shows 0.7, 0.9, 0.11. What should Flint do?",
    continueLabel: "Continue with 0.13",
    disarmLabel: "This is not an increasing sequence. Do not continue—disarm the trap.",
    disarmed: "Trap disarmed! Flint must not continue on the original route. Bellum will offer a different route.",
    reflection: "Flint’s method produced a correct answer on the earlier decimal flight, but it missed the change in place value here. Check the whole displayed sequence before choosing another value.",
    correctedPrompt: "Now try a different route: 0.3, 0.5, 0.7. What number comes next?",
    correctedExplanation: "Adding 0.2 to 0.7 gives 0.9. This new route increases by 0.2 each time. Bellum changed all three given numbers to build a different route. Appending a value to the original route would not have removed the decrease.",
    complete: "Keep climbing upstairs! Check every displayed step before continuing a sequence."
  });

  const CORRECTED_ROUTE = freeze({
    sequence: ["0.3", "0.5", "0.7"], nextAnswer: "0.9", step: "0.2"
  });

  const PRACTICES = freeze([
    {
      id: "hundredths-boundary-trap",
      sequence: ["0.96", "0.98", "0.100"],
      expectedDecision: "disarm", nextAnswer: null, step: null
    },
    {
      id: "thousandths-boundary-safe",
      sequence: ["0.096", "0.098", "0.100"],
      expectedDecision: "continue", nextAnswer: "0.102", step: "0.002"
    }
  ]);

  // Decimal arithmetic stays exact, including values beyond Number's integer range.
  // Exposed objects contain strings and numbers, so attempt records remain JSON-safe.
  function parseDecimal(raw) {
    if (typeof raw !== "string" && typeof raw !== "number") return null;
    if (typeof raw === "number" && !Number.isFinite(raw)) return null;
    const text = String(raw).trim();
    if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(text)) return null;
    const negative = text[0] === "-";
    const unsigned = /^[+-]/.test(text) ? text.slice(1) : text;
    const parts = unsigned.split(".");
    const whole = parts[0] || "0";
    const fraction = parts[1] || "";
    if ((whole + fraction).length > 40) return null;
    let digits = (whole + fraction).replace(/^0+(?=\d)/, "");
    let scale = fraction.length;
    while (scale > 0 && digits.endsWith("0")) {
      digits = digits.slice(0, -1);
      scale -= 1;
    }
    if (!digits || /^0+$/.test(digits)) return { negative: false, digits: "0", scale: 0, normalized: "0" };
    const signed = (negative ? -1n : 1n) * BigInt(digits);
    return { negative, digits, scale, normalized: formatDecimal(signed, scale) };
  }

  function formatDecimal(coefficient, scale) {
    const negative = coefficient < 0n;
    let digits = (negative ? -coefficient : coefficient).toString();
    if (scale) {
      digits = digits.padStart(scale + 1, "0");
      digits = digits.slice(0, -scale) + "." + digits.slice(-scale);
      digits = digits.replace(/0+$/, "").replace(/\.$/, "");
    }
    return (negative && coefficient !== 0n ? "-" : "") + digits;
  }

  function coefficientAt(parsed, scale) {
    return (parsed.negative ? -1n : 1n) * BigInt(parsed.digits) * 10n ** BigInt(scale - parsed.scale);
  }

  function compareDecimals(left, right) {
    const a = parseDecimal(left);
    const b = parseDecimal(right);
    if (!a || !b) return null;
    const scale = Math.max(a.scale, b.scale);
    const difference = coefficientAt(a, scale) - coefficientAt(b, scale);
    return difference < 0n ? -1 : difference > 0n ? 1 : 0;
  }

  function equivalentDecimals(left, right) {
    return compareDecimals(left, right) === 0;
  }

  function inspectSequence(values) {
    if (!Array.isArray(values) || values.length < 2) {
      return { valid: false, increasing: false, violatingPairs: [], constantStep: false, step: null, next: null };
    }
    const parsed = values.map(parseDecimal);
    if (parsed.some(value => !value)) {
      return { valid: false, increasing: false, violatingPairs: [], constantStep: false, step: null, next: null };
    }
    const scale = Math.max(...parsed.map(value => value.scale));
    const coefficients = parsed.map(value => coefficientAt(value, scale));
    const differences = coefficients.slice(1).map((value, index) => value - coefficients[index]);
    const violatingPairs = differences.flatMap((value, index) => value <= 0n ? [index] : []);
    const increasing = violatingPairs.length === 0;
    const constantStep = differences.every(value => value === differences[0]);
    const step = constantStep ? formatDecimal(differences[0], scale) : null;
    return {
      valid: true, increasing, violatingPairs, constantStep, step,
      // An invalid increasing route never receives a proposed continuation.
      next: increasing && constantStep ? formatDecimal(coefficients.at(-1) + differences[0], scale) : null
    };
  }

  function canAppendToIncreasingSequence(values, nextValue) {
    const sequence = inspectSequence(values);
    if (!sequence.valid || !sequence.increasing || !sequence.constantStep) return false;
    return equivalentDecimals(nextValue, sequence.next);
  }

  function gradeRepairPair(index) {
    const correct = index === 1;
    return {
      correct,
      feedback: correct
        ? "Correct. Compare the tenths digits: 9 in 0.9 and 1 in 0.11. Since 9 > 1, 0.9 > 0.11. The move from 0.9 to 0.11 is a decrease, so the route is not an increasing sequence."
        : "The tenths digits increase from 7 in 0.7 to 9 in 0.9, so 0.7 < 0.9: the first step increases. Now compare 0.9 with 0.11. The tenths digit decreases from 9 to 1, so 0.11 is smaller than 0.9. This second step decreases."
    };
  }

  function gradeTrapDecision(choice) {
    const correct = choice === "disarm";
    return {
      correct,
      feedback: correct
        ? "Correct. The tenths digit decreases from 9 in 0.9 to 1 in 0.11, so 0.11 is smaller than 0.9. This sequence contains a decrease. You chose not to continue with 0.13 and disarmed the trap. Flint must not continue on this route."
        : "Every number must be greater than the number before it. Compare the tenths digits: 9 in 0.9 and 1 in 0.11. Since 1 < 9, 0.11 is smaller than 0.9, so this sequence contains a decrease. Adding another number cannot remove that decrease. Do not continue. Select the option that says the sequence is not increasing, then select “Check my choice” to disarm the trap."
    };
  }

  function gradeCorrectedAnswer(value) {
    const parsed = parseDecimal(value);
    const correct = !!parsed && equivalentDecimals(value, CORRECTED_ROUTE.nextAnswer);
    return {
      correct,
      feedback: correct
        ? "Correct! 0.7 + 0.2 = 0.9. The new route keeps increasing by 0.2."
        : parsed
          ? "The new route increases by 0.2 each time. Add 0.2 to 0.7."
          : "Enter a decimal number, such as 0.4."
    };
  }

  function gradePracticeAnswer(index, choice, value) {
    const practice = PRACTICES[index];
    if (!practice || !["continue", "disarm"].includes(choice)) {
      return { validResponse: false, correct: false, feedback: "Enter the next number or choose to disarm the trap." };
    }
    if (choice === "continue" && !parseDecimal(value)) {
      return { validResponse: false, correct: false, feedback: String(value ?? "").trim() === ""
        ? "Enter a decimal number, or choose to disarm the trap. A blank answer does not make a choice."
        : "Enter a decimal number using digits and at most one decimal point, or choose to disarm the trap." };
    }
    const sequence = inspectSequence(practice.sequence);
    const correct = choice === "disarm"
      ? !sequence.increasing
      : canAppendToIncreasingSequence(practice.sequence, value);
    if (!sequence.increasing) {
      return {
        validResponse: true, correct,
        feedback: correct
          ? "Correct. Compare 0.98 with 0.100. The tenths digit decreases from 9 in 0.98 to 1 in 0.100, so 0.100 is smaller than 0.98. This sequence contains a decrease; adding another number cannot remove that decrease. You disarmed the trap instead of continuing. Flint stays safely at the entrance."
          : "Compare 0.98 with 0.100. The tenths digit decreases from 9 in 0.98 to 1 in 0.100, so 0.100 is smaller than 0.98. This is not an increasing sequence. Adding another number cannot remove that decrease. Do not continue. Disarm the trap and keep Flint at the entrance."
      };
    }
    return {
      validResponse: true, correct,
      feedback: correct
        ? "Correct. 0.096 < 0.098 < 0.100 < 0.102. For 0.096 and 0.098, the tenths and hundredths digits match; compare the thousandths digits: 6 < 8. For 0.098 and 0.100, compare the tenths digits: 0 < 1. Each step adds 0.002, and 0.100 + 0.002 = 0.102. Continue with 0.102 so Flint can climb this route."
        : choice === "disarm"
          ? "Compare 0.096 with 0.098. The tenths and hundredths digits match, but the thousandths digit increases from 6 to 8, so 0.096 < 0.098. Next compare 0.098 with 0.100. The tenths digit increases from 0 to 1, so 0.098 < 0.100. This sequence increases by 0.002 at each step. Add 0.002 to 0.100, then enter the next number to continue."
          : "Compare 0.096 with 0.098. The tenths and hundredths digits match, but the thousandths digit increases from 6 to 8, so 0.096 < 0.098. Next compare 0.098 with 0.100. The tenths digit increases from 0 to 1, so 0.098 < 0.100. Each step adds 0.002. Add 0.002 to 0.100, then enter the result."
    };
  }

  return freeze({
    FLIGHTS, COPY, CORRECTED_ROUTE, PRACTICES,
    parseDecimal, compareDecimals, equivalentDecimals, inspectSequence,
    canAppendToIncreasingSequence, gradeRepairPair, gradeTrapDecision, gradeCorrectedAnswer, gradePracticeAnswer
  });
});
