"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const lesson = require("../lesson.js");

test("the first three recorded routes increase at a constant step and accept Flint's values", () => {
  for (const flight of lesson.FLIGHTS.slice(0, 3)) {
    const result = lesson.inspectSequence(flight.sequence);
    assert.equal(result.increasing, true, flight.id);
    assert.equal(result.constantStep, true, flight.id);
    assert.equal(result.next, flight.nextAnswer, flight.id);
    assert.equal(lesson.canAppendToIncreasingSequence(flight.sequence, flight.nextAnswer), true);
  }
});

test("the final route contains an earlier decrease that no appended reading can repair", () => {
  const trap = lesson.FLIGHTS[3];
  const result = lesson.inspectSequence(trap.sequence);
  assert.deepEqual(result.violatingPairs, [1]);
  assert.equal(result.increasing, false);
  assert.equal(result.next, null);
  for (const value of ["1.13", "2.3", "9999999999999999999999999999999999999999"]) {
    assert.equal(lesson.canAppendToIncreasingSequence(trap.sequence, value), false);
    assert.equal(lesson.inspectSequence([...trap.sequence, value]).increasing, false);
  }
});

test("repair requires the decreasing neighboring pair and disarming the invalid route", () => {
  assert.equal(lesson.gradeRepairPair(0).correct, false);
  assert.equal(lesson.gradeRepairPair(1).correct, true);
  assert.equal(lesson.gradeRepairPair("1").correct, false);
  assert.equal(lesson.gradeTrapDecision("continue").correct, false);
  assert.equal(lesson.gradeTrapDecision("disarm").correct, true);
  assert.equal(lesson.gradeTrapDecision("anything else").correct, false);
});

test("the separate corrected route crosses the whole-number boundary by two tenths", () => {
  const result = lesson.inspectSequence(lesson.CORRECTED_ROUTE.sequence);
  assert.equal(result.increasing, true);
  assert.equal(result.step, "0.2");
  assert.equal(result.next, "2.3");
  for (const value of ["2.3", "2.30", "02.300", "+2.300", " 2.3 "]) {
    assert.equal(lesson.gradeCorrectedAnswer(value).correct, true, value);
  }
  for (const value of ["2.13", "2.12", "2.5", "2.300000000000000000000000000000000000001"]) {
    assert.equal(lesson.gradeCorrectedAnswer(value).correct, false, value);
  }
});

test("comparison uses decimal place values, including long values and equivalent zeros", () => {
  assert.equal(lesson.compareDecimals("1.9", "1.11"), 1);
  assert.equal(lesson.compareDecimals("-1.9", "-1.11"), -1);
  assert.equal(lesson.compareDecimals("0.6", "0.60"), 0);
  assert.equal(lesson.compareDecimals("-0.000", "0"), 0);
  assert.equal(lesson.compareDecimals("9007199254740993", "9007199254740992"), 1);
  assert.equal(lesson.compareDecimals("1.000000000000000000000000000000000000001", "1"), 1);
  assert.equal(lesson.parseDecimal(".01").normalized, "0.01");
});

test("malformed or overlong inputs cannot pass a numerical answer check", () => {
  for (const value of ["", " ", "2..3", "2.3kg", "2,3", "2e0", "Infinity", "NaN", "0x23", "2.", ".", null, true, {}, "1".repeat(41)]) {
    assert.equal(lesson.parseDecimal(value), null, String(value));
    assert.equal(lesson.gradeCorrectedAnswer(value).correct, false, String(value));
  }
  assert.equal(lesson.compareDecimals("bad", "1"), null);
  assert.equal(lesson.inspectSequence(["1", "bad", "3"]).valid, false);
});

test("repeated values are not strictly increasing, and unequal steps do not imply a next value", () => {
  assert.deepEqual(lesson.inspectSequence(["1", "1.0", "2"]).violatingPairs, [0]);
  const result = lesson.inspectSequence(["1", "2", "4"]);
  assert.equal(result.increasing, true);
  assert.equal(result.constantStep, false);
  assert.equal(result.next, null);
  assert.equal(lesson.canAppendToIncreasingSequence(["1", "2", "4"], "6"), false);
});

test("lesson definitions are immutable and all public results can be stored as JSON", () => {
  assert.equal(Object.isFrozen(lesson.FLIGHTS), true);
  assert.equal(Object.isFrozen(lesson.FLIGHTS[0].sequence), true);
  assert.throws(() => lesson.FLIGHTS[3].sequence.push("1.13"), TypeError);
  assert.doesNotThrow(() => JSON.stringify({
    data: lesson.FLIGHTS, parsed: lesson.parseDecimal("2.30"),
    sequence: lesson.inspectSequence(lesson.FLIGHTS[3].sequence),
    grade: lesson.gradeCorrectedAnswer("2.30")
  }));
});
