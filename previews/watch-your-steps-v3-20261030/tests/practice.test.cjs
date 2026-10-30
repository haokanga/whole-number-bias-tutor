"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const lesson = require("../lesson.js");

test("the first practice route already decreases and cannot be repaired by appending a number", () => {
  const route = lesson.PRACTICES[0];
  assert.deepEqual(route.sequence, ["1.96", "1.98", "1.100"]);
  assert.equal(lesson.compareDecimals("1.100", "1.1"), 0);
  assert.equal(lesson.compareDecimals("1.100", "1.98"), -1);
  assert.deepEqual(lesson.inspectSequence(route.sequence).violatingPairs, [1]);
  for (const value of ["1.102", "1.1020", "2", "100", "-1", "1.980000000000000000000000000000000000001"]) {
    const grade = lesson.gradePracticeAnswer(0, "continue", value);
    assert.equal(grade.validResponse, true, value);
    assert.equal(grade.correct, false, value);
    assert.equal(lesson.inspectSequence([...route.sequence, value]).increasing, false, value);
    assert.match(grade.feedback, /1\.100 = 1\.1/);
  }
  const disarmed = lesson.gradePracticeAnswer(0, "disarm");
  assert.equal(disarmed.validResponse, true);
  assert.equal(disarmed.correct, true);
  assert.match(disarmed.feedback, /Flint stays safely at the entrance/);
});

test("the second practice route accepts 1.102 by exact place-value comparison", () => {
  const route = lesson.PRACTICES[1];
  assert.deepEqual(route.sequence, ["1.096", "1.098", "1.100"]);
  const inspection = lesson.inspectSequence(route.sequence);
  assert.equal(inspection.increasing, true);
  assert.equal(inspection.step, "0.002");
  assert.equal(inspection.next, "1.102");
  for (const value of ["1.102", "1.1020", "01.10200", "+1.102", " 1.102 "]) {
    const grade = lesson.gradePracticeAnswer(1, "continue", value);
    assert.equal(grade.validResponse, true, value);
    assert.equal(grade.correct, true, value);
    assert.match(grade.feedback, /1\.096 < 1\.098 < 1\.100 < 1\.102/);
    assert.match(grade.feedback, /0\.002/);
  }
  for (const value of ["1.12", "1.104", "1.100", "1.102000000000000000000000000000000000001"]) {
    assert.equal(lesson.gradePracticeAnswer(1, "continue", value).correct, false, value);
  }
  assert.equal(lesson.gradePracticeAnswer(1, "disarm").correct, false);
});

test("blank or malformed practice inputs are validation errors, not numerical decisions", () => {
  for (const index of [0, 1]) {
    for (const value of ["", " ", "1..102", "1.102kg", "1e0", "1,102", ".", null, "1".repeat(41)]) {
      const grade = lesson.gradePracticeAnswer(index, "continue", value);
      assert.equal(grade.validResponse, false, String(value));
      assert.equal(grade.correct, false, String(value));
      assert.doesNotMatch(grade.feedback, /0\.002|1\.102|1\.98/);
    }
  }
  assert.equal(lesson.gradePracticeAnswer(2, "disarm").validResponse, false);
  assert.equal(lesson.gradePracticeAnswer(0, "skip").validResponse, false);
});

test("the practice definitions remain immutable and feedback records are JSON-safe", () => {
  assert.equal(Object.isFrozen(lesson.PRACTICES), true);
  assert.equal(Object.isFrozen(lesson.PRACTICES[0].sequence), true);
  assert.throws(() => lesson.PRACTICES[0].sequence.push("1.102"), TypeError);
  assert.doesNotThrow(() => JSON.stringify({
    practices: lesson.PRACTICES,
    invalid: lesson.gradePracticeAnswer(0, "continue", "1.102"),
    valid: lesson.gradePracticeAnswer(1, "continue", "1.1020")
  }));
});
