import assert from "node:assert/strict"
import test from "node:test"
import reduce, {
  createCaptureState,
  canCollectDirectly,
  type CaptureState,
} from "./captureAttemptState.ts"

function fail(state: CaptureState) {
  return reduce(state, {
    type: "failure",
    generation: state.generation,
    reason: "render",
  })
}
function retry(state: CaptureState) {
  return reduce(state, { type: "retry", generation: state.generation })
}
function failThreeTimes() {
  return fail(retry(fail(retry(fail(createCaptureState())))))
}

test("fallback unlocks only after three separate failed attempts", () => {
  let state = createCaptureState()
  for (let attempt = 1; attempt <= 3; attempt++) {
    state = fail(state)
    assert.equal(state.failures.length, attempt)
    assert.equal(state.stage, attempt === 3 ? "failed" : "retrying")
    assert.equal(canCollectDirectly(state, 20), attempt === 3)
    assert.equal(
      fail(state),
      state,
      "duplicate errors must not count as attempts",
    )
    if (attempt < 3) {
      assert.equal(
        reduce(state, { type: "collect", distanceMeters: 20 }),
        state,
      )
      state = retry(state)
    }
  }
})

test("direct collection requires a valid distance within 50 m and runs once", () => {
  const state = failThreeTimes()
  for (const distance of [50.01, 75, -1, NaN, Infinity]) {
    assert.equal(
      reduce(state, { type: "collect", distanceMeters: distance }),
      state,
    )
  }
  for (const distance of [0, 20, 50]) {
    const collected = reduce(state, {
      type: "collect",
      distanceMeters: distance,
    })
    assert.equal(collected.stage, "collecting")
    assert.equal(collected.direct, true)
    assert.equal(
      reduce(collected, { type: "collect", distanceMeters: distance }),
      collected,
    )
  }
})

test("successful flag rendering clears consecutive failures and enables flag capture", () => {
  let state = retry(fail(createCaptureState()))
  state = reduce(state, {
    type: "progress",
    generation: state.generation,
    progress: 1,
  })
  state = reduce(state, { type: "ready", generation: state.generation })
  assert.equal(state.failures.length, 0)
  assert.equal(state.stage, "ready")
  const collected = reduce(state, { type: "collect", distanceMeters: 20 })
  assert.equal(collected.stage, "collecting")
  assert.equal(collected.direct, false)
  assert.equal(fail(collected), collected)
})

test("late events cannot alter a retry or a restarted session", () => {
  const state = retry(fail(createCaptureState()))
  assert.equal(
    reduce(state, { type: "failure", generation: 0, reason: "camera" }),
    state,
  )
  assert.equal(reduce(state, { type: "ready", generation: 0 }), state)
  const failed = failThreeTimes()
  const restarted = reduce(failed, { type: "restart" })
  assert.equal(restarted.stage, "opening")
  assert.equal(restarted.failures.length, 0)
  assert.equal(restarted.failureTimes.length, 0)
  assert.equal(
    reduce(restarted, {
      type: "failure",
      generation: failed.generation,
      reason: "scan",
    }),
    restarted,
  )
})

test("forced restart resets active scan or ready flag for demo toggle but not active collection", () => {
  let ready = reduce(createCaptureState(), {
    type: "progress",
    generation: 0,
    progress: 1,
  })
  ready = reduce(ready, { type: "ready", generation: 0 })
  const restarted = reduce(ready, { type: "restart", force: true })
  assert.equal(restarted.stage, "opening")
  assert.equal(restarted.generation, ready.generation + 1)
  assert.equal(restarted.failures.length, 0)

  const collecting = reduce(ready, { type: "collect", distanceMeters: 20 })
  assert.equal(
    reduce(collecting, { type: "restart", force: true }),
    collecting,
  )
})

test("failure timestamps align with recorded failures", () => {
  let state = createCaptureState()
  state = reduce(state, {
    type: "failure",
    generation: 0,
    reason: "render",
    time: "12:00:01",
  })
  assert.deepEqual(state.failures, ["render"])
  assert.deepEqual(state.failureTimes, ["12:00:01"])
})
