import { useEffect, useReducer, useRef, useState } from "react"
import captureAttemptState, {
  createCaptureState,
  canCollectDirectly,
  MAX_CAPTURE_ATTEMPTS,
  type FailureReason,
} from "./captureAttemptState"
import { CameraIcon, CloseIcon } from "./CaptureSheet"
import useCaptureDialog from "./useCaptureDialog"
import "./CaptureExperience.css"
// Visual prototype: recorded camera footage and a CSS 3D collectible.
// Flutter replaces media progress with native camera/AR tracking events.
const CAMERA_PREVIEW =
  "https://res.cloudinary.com/dvxemrtys/video/upload/v1794307703/Video_Project_1_pcsckv.mp4"
const FAILURE_LABELS: Record<FailureReason, string> = {
  camera: "Camera unavailable",
  scan: "Camera view interrupted",
  render: "Flag didn’t appear",
}
function formatFailureTime() {
  return new Date().toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}
function readInitialDemoConfig() {
  const query = new URLSearchParams(window.location.search)
  const rawDistance = query.get("captureDistance")
  return {
    fail: query.get("captureDemo") === "fail",
    distanceMeters:
      rawDistance !== null && rawDistance.trim() !== ""
        ? Number(rawDistance)
        : 20,
  }
}
export default function CaptureCamera({
  locationTitle = "Gold Name",
  rewardCoins = 50,
  onCaptureSuccess,
  onClose,
}: {
  locationTitle?: string
  rewardCoins?: number
  onCaptureSuccess: () => void
  onClose: () => void
}) {
  const [state, dispatch] = useReducer(captureAttemptState, undefined, () =>
    createCaptureState(),
  )
  const { stage, generation, progress, failures, failureTimes, direct } = state
  // Hidden presentation controls. Distance is mock data, not measured GPS.
  const [initialDemo] = useState(readInitialDemoConfig)
  const [demoFail, setDemoFail] = useState(initialDemo.fail)
  const distanceMeters = initialDemo.distanceMeters
  const videoRef = useRef<HTMLVideoElement>(null)
  const flagAssetReadyRef = useRef(false)
  const playbackRef = useRef({ previous: 0, scanned: 0, lastFrame: Date.now() })
  const completeRef = useRef(onCaptureSuccess)
  completeRef.current = onCaptureSuccess
  const dialogRef = useCaptureDialog(onClose)
  const recordFailure = (gen: number, reason: FailureReason) => {
    dispatch({
      type: "failure",
      generation: gen,
      reason,
      time: formatFailureTime(),
    })
  }
  const toggleDemoFail = () => {
    if (stage === "collecting") return
    setDemoFail((current) => !current)
    dispatch({ type: "restart", force: true })
  }
  useEffect(() => {
    playbackRef.current = { previous: 0, scanned: 0, lastFrame: Date.now() }
    flagAssetReadyRef.current = false
    const flagAsset = new Image()
    flagAsset.onload = () => {
      flagAssetReadyRef.current = true
      if (!demoFail && playbackRef.current.scanned >= 3.2) {
        dispatch({ type: "ready", generation })
      }
    }
    flagAsset.onerror = () => {
      if (!demoFail) recordFailure(generation, "render")
    }
    flagAsset.src = "/assets/08c22.png"
    const started = Date.now()
    // The hidden failure demo deliberately suppresses flag rendering, including
    // when the video is unavailable, so all three attempts are demonstrable.
    const timer = window.setInterval(
      () => {
        if (demoFail) {
          const fraction = Math.min((Date.now() - started) / 2400, 1)
          dispatch({ type: "progress", generation, progress: fraction })
          if (fraction === 1) {
            recordFailure(generation, "render")
            window.clearInterval(timer)
          }
        } else if (
          playbackRef.current.scanned >= 3.2 &&
          !flagAssetReadyRef.current &&
          Date.now() - started > 12000
        ) {
          recordFailure(generation, "render")
          window.clearInterval(timer)
        } else if (Date.now() - playbackRef.current.lastFrame > 12000) {
          recordFailure(
            generation,
            playbackRef.current.scanned > 0 ? "scan" : "camera",
          )
          window.clearInterval(timer)
        }
      },
      demoFail ? 100 : 500,
    )
    return () => {
      window.clearInterval(timer)
      flagAsset.onload = null
      flagAsset.onerror = null
    }
  }, [generation, demoFail])
  useEffect(() => {
    if (stage !== "retrying") return
    const timer = window.setTimeout(
      () => dispatch({ type: "retry", generation }),
      900,
    )
    return () => window.clearTimeout(timer)
  }, [stage, generation])
  useEffect(() => {
    if (stage !== "collecting") return
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 420
    const timer = window.setTimeout(() => completeRef.current(), duration)
    return () => window.clearTimeout(timer)
  }, [stage])
  useEffect(() => {
    if (stage === "failed") {
      videoRef.current?.pause()
      dialogRef.current?.focus()
    }
  }, [stage, dialogRef])
  const retry = () => {
    dispatch({ type: "restart" })
    dialogRef.current?.focus()
  }
  const onFrame = () => {
    const video = videoRef.current
    if (
      !video ||
      video.paused ||
      !["opening", "scanning", "ready"].includes(stage)
    )
      return
    const playback = playbackRef.current
    const currentTime = video.currentTime
    const delta = currentTime - playback.previous
    // Preserve the existing four-second camera clip loop.
    if (currentTime >= 4) {
      video.currentTime = 0
      playback.previous = 0
    } else {
      playback.previous = currentTime
    }
    if (delta <= 0 || delta > 1) return
    playback.lastFrame = Date.now()
    if (demoFail || stage === "ready") return
    playback.scanned += delta
    dispatch({ type: "progress", generation, progress: playback.scanned / 3.2 })
    if (playback.scanned >= 3.2 && flagAssetReadyRef.current) dispatch({ type: "ready", generation })
  }
  const collect = () =>
    dispatch({ type: "collect", distanceMeters })
  const isScanning =
    stage === "opening" || stage === "scanning" || stage === "retrying"
  const isRecovery = stage === "failed" || (stage === "collecting" && direct)
  const directAvailable =
    canCollectDirectly(state, distanceMeters) ||
    (stage === "collecting" && direct)
  const hasValidDistance =
    Number.isFinite(distanceMeters) && distanceMeters >= 0
  const proximitySummary = !hasValidDistance
    ? "Distance unavailable"
    : distanceMeters <= 50
      ? `Within ${Math.round(distanceMeters)} m · 50 m limit`
      : `${Math.round(distanceMeters)} m away · 50 m limit`
  const attemptNumber = Math.min(
    failures.length + (stage === "retrying" ? 0 : 1),
    MAX_CAPTURE_ATTEMPTS,
  )
  const title =
    stage === "opening"
      ? "Opening camera…"
      : stage === "retrying"
        ? "Trying again…"
        : stage === "scanning"
          ? "Finding the flag…"
          : stage === "collecting"
            ? "Captured"
            : "You found a flag"
  return (
    <div
      className="capture-camera-overlay cx-ui"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-title"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.shiftKey && event.key.toLowerCase() === "f") {
          event.preventDefault()
          toggleDemoFail()
        }
      }}
    >
      <div className="capture-camera-shell">
        <video
          key={generation}
          ref={videoRef}
          className="capture-camera-video"
          src={CAMERA_PREVIEW}
          autoPlay
          playsInline
          muted
          loop
          onTimeUpdate={onFrame}
          onError={() => {
            if (!demoFail) recordFailure(generation, "camera")
          }}
          onCanPlay={(event) => {
            const video = event.currentTarget
            video.play().catch(() => {
              if (videoRef.current === video && !demoFail)
                recordFailure(generation, "camera")
            })
          }}
        />
        <div className="capture-camera-shade" aria-hidden="true" />
        <header className="capture-camera-top">
          <button
            className="cx-icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close camera"
          >
            <CloseIcon />
          </button>
          <span className="capture-camera-mode">
            <span aria-hidden="true" />
            CAMERA CAPTURE
          </span>
          <span
            className={`capture-camera-preview ${
              demoFail ? "is-fail-demo" : ""
            }`}
            onClick={toggleDemoFail}
          >
            Preview
          </span>
        </header>
        {!isRecovery && (
          <>
            <div className="capture-camera-stage">
              {isScanning && (
                <div className="capture-reticle" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <span className="capture-scan-line" />
                </div>
              )}
              {(stage === "ready" || stage === "collecting") && (
                <button
                  className={`capture-flag ${
                    stage === "collecting" ? "is-collected" : ""
                  }`}
                  onClick={collect}
                  disabled={stage === "collecting"}
                  type="button"
                  aria-label={`Capture the flag for ${rewardCoins} coins`}
                >
                  <span className="capture-flag-halo" aria-hidden="true" />
                  <span className="capture-flag-coin" aria-hidden="true">
                    <img src="/assets/08c22.png" alt="" />
                    <span />
                  </span>
                  <span className="capture-flag-shadow" aria-hidden="true" />
                </button>
              )}
            </div>
            <footer className="capture-camera-bottom">
              <div
                className="capture-camera-instruction"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="cx-eyebrow">
                  {isScanning
                    ? "01 / SCAN YOUR SURROUNDINGS"
                    : "02 / CAPTURE YOUR FIND"}
                </span>
                <h1 id="camera-title">{title}</h1>
                <p>
                  {isScanning
                    ? "Move your phone slowly around the place."
                    : stage === "collecting"
                      ? "Adding your reward…"
                      : "Tap the flag on the screen to capture it."}
                </p>
              </div>
              <div className="capture-camera-location">
                <div>
                  <span>GOLD FLAG</span>
                  <h2>{locationTitle}</h2>
                </div>
                <span className="capture-camera-reward">
                  <span aria-hidden="true" className="cx-small-coin" />
                  {rewardCoins} coins
                </span>
              </div>
              {isScanning && (
                <p className="capture-attempt-status" role="status">
                  {stage === "retrying"
                    ? `Attempt ${attemptNumber} unsuccessful · Retrying automatically`
                    : `Attempt ${attemptNumber} of ${MAX_CAPTURE_ATTEMPTS}`}
                </p>
              )}
              {isScanning && (
                <div
                  className="capture-scan-progress"
                  role="progressbar"
                  aria-label="Scanning surroundings"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress * 100)}
                >
                  <span style={{ transform: `scaleX(${progress})` }} />
                </div>
              )}
            </footer>
          </>
        )}
        {isRecovery && (
          <div className="capture-recovery" role="status">
            <div className="capture-recovery-icon">
              <CameraIcon />
            </div>
            <span className="cx-eyebrow">
              {directAvailable
                ? "YOU’RE IN THE RIGHT PLACE"
                : "MOVE CLOSER TO THE FLAG"}
            </span>
            <h1 id="camera-title">
              {stage === "collecting"
                ? "Adding your reward…"
                : "Trouble finding the flag?"}
            </h1>
            <p>
              {directAvailable
                ? "Looks like you are not able to see the flag after 3 attempts. You’re within 50 m, so you can collect it directly."
                : "Looks like you are not able to see the flag after 3 attempts. Move within 50 m of the flag, then try again."}
            </p>
            <div className="capture-failure-log-box">
              <div className="capture-failure-log-head">
                <span>FAILURE LOG</span>
                <span>{proximitySummary}</span>
              </div>
              <ol
                className="capture-failure-log"
                aria-label="Capture attempt log"
              >
                {failures.map((reason, index) => (
                  <li key={index}>
                    <span>
                      Attempt {index + 1}
                      {failureTimes[index] ? ` · ${failureTimes[index]}` : ""}
                    </span>
                    <span>{FAILURE_LABELS[reason]}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="capture-recovery-reward">
              <span>{locationTitle}</span>
              <strong>+{rewardCoins} coins</strong>
            </div>
            {directAvailable && (
              <button
                className="cx-primary"
                onClick={collect}
                disabled={stage === "collecting"}
                type="button"
              >
                {stage === "collecting" ? "Collecting…" : "Collect directly"}
              </button>
            )}
            <button
              className={directAvailable ? "cx-secondary" : "cx-primary"}
              onClick={retry}
              disabled={stage === "collecting"}
              type="button"
            >
              Try scanning again
            </button>
            <span className="capture-recovery-note">
              {stage === "collecting"
                ? "Collecting your coins…"
                : "Your coins haven’t been collected yet."}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
