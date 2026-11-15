import type { ReactNode } from "react"
import useCaptureDialog from "./useCaptureDialog"
import "./CaptureExperience.css"
export function CameraIcon() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 5.5 9.5 3h5L16 5.5h3a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}
export function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}
export default function CaptureSheet({
  onCapture,
  onDismiss,
  reward,
}: {
  onCapture: () => void
  onDismiss: () => void
  reward: ReactNode
}) {
  const dialogRef = useCaptureDialog(onDismiss)
  return (
    <div
      className="capture-details-overlay cx-ui"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="capture-title"
      tabIndex={-1}
    >
      <div
        className="capture-details-scrim"
        onClick={onDismiss}
        aria-hidden="true"
      />
      <section className="capture-details-panel">
        <img
          className="capture-details-handle"
          src="/assets/efdf0.svg"
          alt=""
        />
        <div className="capture-details-heading">
          <div>
            <h1 id="capture-title">Gold Name</h1>
            <p className="cx-distance">0.2 mi • Gold Flag</p>
          </div>
          {reward}
        </div>
        <div className="capture-details-guide">
          <span className="capture-details-camera">
            <CameraIcon />
          </span>
          <div>
            <h2>Capture with your camera</h2>
            <p>
              Scan the place around you, then tap the flag on the screen to
              capture it.
            </p>
          </div>
        </div>
        <button className="cx-primary" onClick={onCapture} type="button">
          <CameraIcon />
          Capture
          <span aria-hidden="true" className="cx-button-arrow">
            ↗
          </span>
        </button>
        <p className="capture-details-note">Your camera opens next</p>
      </section>
    </div>
  )
}
