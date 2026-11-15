export const MAX_CAPTURE_ATTEMPTS = 3
export type FailureReason = "camera" | "scan" | "render"
export type CaptureStage = "opening" | "scanning" | "ready" | "retrying" | "failed" | "collecting"
export type CaptureState = {
  stage: CaptureStage
  generation: number
  progress: number
  failures: FailureReason[]
  failureTimes: string[]
  direct: boolean
}
export type CaptureEvent = {
  type: "progress"
  generation: number
  progress: number
} | { type: "ready"; generation: number } | {
  type: "failure"
  generation: number
  reason: FailureReason
  time?: string
} | { type: "retry"; generation: number } | {
  type: "restart"
  force?: boolean
} | {
  type: "collect"
  distanceMeters: number
}

export function createCaptureState(generation = 0): CaptureState {
  return {
    stage: "opening",
    generation,
    progress: 0,
    failures: [],
    failureTimes: [],
    direct: false,
  }
}

export function canCollectDirectly(
  state: CaptureState,
  distanceMeters: number,
) {
  return (
    state.stage === "failed" &&
    state.failures.length === MAX_CAPTURE_ATTEMPTS &&
    Number.isFinite(distanceMeters) &&
    distanceMeters >= 0 &&
    distanceMeters <= 50
  )
}

/** Ignore late media events and count each failed attempt only once. */
export default function captureAttemptState(
  state: CaptureState,
  event: CaptureEvent,
): CaptureState {
  if ("generation" in event && event.generation !== state.generation)
    return state
  switch (event.type) {
    case "progress":
      return state.stage === "opening" || state.stage === "scanning"
        ? {
            ...state,
            stage: "scanning",
            progress: Math.min(1, Math.max(0, event.progress)),
          }
        : state
    case "ready":
      return state.stage === "scanning"
        ? {
            ...state,
            stage: "ready",
            progress: 1,
            failures: [],
            failureTimes: [],
          }
        : state
    case "failure": {
      if (!["opening", "scanning", "ready"].includes(state.stage)) return state
      const failures = [...state.failures, event.reason]
      const failureTimes = [...state.failureTimes, event.time ?? ""]
      return {
        ...state,
        failures,
        failureTimes,
        stage: failures.length === MAX_CAPTURE_ATTEMPTS ? "failed" : "retrying",
      }
    }
    case "retry":
      return state.stage === "retrying"
        ? {
            ...state,
            stage: "opening",
            progress: 0,
            generation: state.generation + 1,
          }
        : state
    case "restart":
      return state.stage === "failed" ||
        (event.force && state.stage !== "collecting")
        ? createCaptureState(state.generation + 1)
        : state
    case "collect":
      return state.stage === "ready" ||
        canCollectDirectly(state, event.distanceMeters)
        ? { ...state, stage: "collecting", direct: state.stage === "failed" }
        : state
  }
}
