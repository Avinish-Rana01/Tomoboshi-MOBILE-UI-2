import { useState, useRef, useEffect, type CSSProperties } from "react"
import "./CaptureFlow.css"

export const starCoinFrontImg = "/assets/08c22.png"
const starCoinBackImg = "/assets/20c4b.png"

export function StarCoin3D() {
  return (
    <div className="cf-3d-coin-assembly">
      {/* Grounding Spatial Shadow */}
      <div className="cf-coin-ground-shadow" />

      {/* Floating Gold Sparkles */}
      <div className="cf-coin-sparkle-field" aria-hidden="true">
        <span className="cf-sparkle sp1">✦</span>
        <span className="cf-sparkle sp2">★</span>
        <span className="cf-sparkle sp3">✦</span>
      </div>

      {/* 3D Coin Cylinder Body with Extrusion */}
      <div className="cf-coin-3d-body">
        {/* Front Face: Exact Tomoboshi Star Coin with Smiling Face */}
        <div className="cf-coin-face cf-coin-front">
          <img
            alt="Tomoboshi Star Coin"
            className="cf-coin-asset-img"
            draggable={false}
            src={starCoinFrontImg}
          />
          <span className="cf-coin-specular-glare" />
        </div>

        {/* 3D Extruded Coin Edge Layers (Physical Thickness) */}
        <div className="cf-coin-edge-rim" aria-hidden="true">
          <span className="cf-edge-ring r1" />
          <span className="cf-edge-ring r2" />
          <span className="cf-edge-ring r3" />
          <span className="cf-edge-ring r4" />
          <span className="cf-edge-ring r5" />
        </div>

        {/* Back Face: Tomoboshi Emblem */}
        <div className="cf-coin-face cf-coin-back">
          <img
            alt="Tomoboshi Medallion"
            className="cf-coin-asset-img"
            draggable={false}
            src={starCoinBackImg}
          />
          <span className="cf-coin-specular-glare" />
        </div>
      </div>

      {/* Concentric Golden Spatial Tracking Rings */}
      <div className="cf-spinning-rings">
        <span className="cf-ring-outer" />
        <span className="cf-ring-inner" />
      </div>
    </div>
  )
}

interface CrateScanLoaderProps {
  isLoading?: boolean
  label?: string
}

export function CrateScanLoader({
  isLoading = true,
  label = "Locating 3D Flag...",
}: CrateScanLoaderProps) {
  return (
    <div
      aria-hidden="true"
      className={`ar-scan-reticle-stage ${isLoading ? "is-visible" : "is-hidden"}`}
    >
      <div className="ar-scan-reticle">
        <svg
          className="ar-scan-svg"
          viewBox="0 0 240 240"
          fill="none"
        >
          {/* Outer dotted guide ring */}
          <circle
            cx="120"
            cy="120"
            r="102"
            stroke="rgba(245, 197, 66, 0.3)"
            strokeWidth="1.5"
            strokeDasharray="6 8"
          />

          {/* Main rotating gold arc ring */}
          <circle
            className="ar-scan-ring-Spin"
            cx="120"
            cy="120"
            r="84"
            stroke="#F5C542"
            strokeWidth="2.5"
            strokeDasharray="52 34 18 34"
            strokeLinecap="round"
          />

          {/* Inner ring */}
          <circle
            cx="120"
            cy="120"
            r="56"
            stroke="rgba(255, 238, 170, 0.6)"
            strokeWidth="1.5"
          />

          {/* Crosshair target markers */}
          <path
            d="M120 48V66M120 174V192M48 120H66M174 120H192"
            stroke="#F5C542"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Center target dot */}
          <circle cx="120" cy="120" r="5" fill="#F5C542" />
        </svg>

        {/* Pulsing radar ripple rings */}
        <span className="ar-scan-pulse-ring" />
        <span className="ar-scan-pulse-ring delay-1" />
      </div>
      <span className="ar-scan-label">{label}</span>
    </div>
  )
}

export interface CaptureFlowProps {
  locationTitle?: string
  distanceLabel?: string
  rewardCoins?: number
  onCaptureSuccess: () => void
  onDismiss: () => void
}

/**
 * CaptureFlow
 * 
 * Provides two capture pathways for the user:
 * 1. Instant Check-In (one-tap direct capture)
 * 2. AR 3D Camera Capture (simulated outdoor video feed with an interactive floating 3D flag)
 */
const OUTDOOR_VIDEO_URL =
  "https://res.cloudinary.com/dvxemrtys/video/upload/v1794307703/Video_Project_1_pcsckv.mp4"

export function ARCameraCapture({
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
  const [isCapturing, setIsCapturing] = useState(false)
  const [permissionState, setPermissionState] = useState<"pending" | "granted">("pending")
  const [isLoading3D, setIsLoading3D] = useState(true)
  const [loadingPhase, setLoadingPhase] = useState<0 | 1 | 2>(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Start 3D scanning timer (4.6s) only once camera permission is allowed
  useEffect(() => {
    if (permissionState === "granted") {
      setIsLoading3D(true)
      setLoadingPhase(0)
      const p1 = setTimeout(() => setLoadingPhase(1), 1600)
      const p2 = setTimeout(() => setLoadingPhase(2), 3100)
      const timer = setTimeout(() => {
        setIsLoading3D(false)
      }, 4600)
      return () => {
        clearTimeout(p1)
        clearTimeout(p2)
        clearTimeout(timer)
      }
    }
  }, [permissionState])

  const handleAllowPermission = () => {
    setPermissionState("granted")
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    }
  }

  const handleDenyPermission = () => {
    onClose()
  }

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= 4) {
      videoRef.current.currentTime = 0
    }
  }

  const handle3DFlagTap = () => {
    if (isCapturing || isLoading3D || permissionState !== "granted") return
    setIsCapturing(true)
    setTimeout(() => {
      onCaptureSuccess()
    }, 450)
  }

  return (
    <div className="cf-ar-viewport" role="dialog" aria-modal="true">
      {/* 9:16 Cropped Outdoor Video Viewport (only renders and plays once permission is granted) */}
      <div className="cf-camera-black-bg absolute inset-0 bg-black overflow-hidden">
        {permissionState === "granted" && (
          <video
            autoPlay
            className="cf-video-feed"
            loop
            muted
            onTimeUpdate={handleTimeUpdate}
            playsInline
            ref={videoRef}
            src={OUTDOOR_VIDEO_URL}
          />
        )}
        {permissionState === "granted" && <div className="cf-camera-grid" />}
      </div>

      {/* Simulated Native iOS Camera Permission Alert */}
      {permissionState === "pending" && (
        <div
          aria-labelledby="ios-camera-title"
          aria-modal="true"
          className="ios-permission-backdrop"
          role="alertdialog"
        >
          <div className="ios-alert-box">
            <div className="ios-alert-body">
              <h3 className="ios-alert-title" id="ios-camera-title">
                “Tomoboshi” Would Like to Access the Camera
              </h3>
              <p className="ios-alert-message">
                Camera access is required to view and capture augmented reality
                3D flags in your physical environment.
              </p>
            </div>
            <div className="ios-alert-actions">
              <button
                className="ios-alert-btn cancel"
                onClick={handleDenyPermission}
                type="button"
              >
                Don’t Allow
              </button>
              <button
                className="ios-alert-btn confirm"
                onClick={handleAllowPermission}
                type="button"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top AR Navigation HUD */}
      <header className="cf-ar-top-bar">
        <button
          aria-label="Exit AR camera view"
          className="cf-ar-close-btn"
          onClick={onClose}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <line x1="18" x2="6" y1="6" y2="18" />
            <line x1="6" x2="18" y1="6" y2="18" />
          </svg>
        </button>
      </header>

      {/* Center 3D Stage with Scanning Reticle & Floating Interactive 3D Flag */}
      <main className="cf-ar-stage">
        {/* AR Viewfinder Square Bracket Reticle — only shown during loading state once allowed */}
        {permissionState === "granted" && isLoading3D && (
          <div className="cf-ar-reticle">
            <span className="cf-bracket tl" />
            <span className="cf-bracket tr" />
            <span className="cf-bracket bl" />
            <span className="cf-bracket br" />
          </div>
        )}

        {/* Circular Scanning Loader (shown while 3D thing is being rendered once allowed) */}
        {permissionState === "granted" && (
          <CrateScanLoader
            isLoading={isLoading3D}
            label={
              loadingPhase === 0
                ? "Scanning Environment..."
                : loadingPhase === 1
                ? "Calibrating 3D Anchor..."
                : "Rendering 3D Star Coin..."
            }
          />
        )}

        {/* The 3D Interactive Target Button (revealed after scan completes) */}
        {permissionState === "granted" && !isLoading3D && (
          <button
            aria-label="Tap 3D Flag to capture and collect coins"
            className="cf-3d-interactive-target"
            onClick={handle3DFlagTap}
            style={
              isCapturing
                ? {
                    transform: "scale(1.3) rotateY(180deg)",
                    opacity: 0,
                    transition: "all 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
                  }
                : undefined
            }
            type="button"
          >
            {/* 3D Tomoboshi Star Coin with Smiling Face */}
            <StarCoin3D />
          </button>
        )}
      </main>

      {/* Bottom AR Action Bar with Floating Glass Card */}
      <footer className="cf-ar-bottom-bar">
        <div className="ar-hud-card-wrapper">
          <div className="ar-floating-glass-card">
            {/* Header Row: Location Kicker + Title & Classic Reward Pill */}
            <div className="ar-card-header-row">
              <div>
                <p className="ar-card-kicker">NAPA VALLEY • GOLDEN TRAIL</p>
                <h2 className="ar-card-title">{locationTitle}</h2>
              </div>
              <div className="ar-card-reward-pill">
                <span className="ar-card-coin-icon">
                  <span className="ar-card-coin-inner" />
                </span>
                <span className="ar-card-reward-text">{rewardCoins} coins</span>
              </div>
            </div>

            {/* User Guidance / Interactive Instruction */}
            <p className="ar-card-instruction">
              Tap the 3D flag or press Unlock Treasure to collect.
            </p>

            {/* Unlock Treasure CTA Button */}
            <button
              aria-label="Unlock Treasure"
              className="ar-card-unlock-cta"
              disabled={
                isCapturing || isLoading3D || permissionState !== "granted"
              }
              onClick={handle3DFlagTap}
              type="button"
            >
              <span>
                {permissionState !== "granted"
                  ? "Camera Access Needed"
                  : isLoading3D
                  ? loadingPhase === 0
                    ? "Scanning Environment..."
                    : loadingPhase === 1
                    ? "Calibrating 3D Anchor..."
                    : "Rendering 3D Coin..."
                  : "Unlock Treasure"}
              </span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function CaptureFlow({
  locationTitle = "Buena Vista Winery",
  distanceLabel = "0.2 mi • Gold Flag",
  rewardCoins = 50,
  onCaptureSuccess,
  onDismiss,
}: CaptureFlowProps) {
  // Modes: "choice" (modal sheet) | "ar-camera" (video feed with 3D flag)
  const [mode, setMode] = useState<"choice" | "ar-camera">("choice")
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Handle local video upload if user wants a custom outdoor clip for demo
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setVideoSrc(url)
    }
  }

  // Handle tapping the 3D flag
  const handle3DFlagTap = () => {
    if (isCapturing) return
    setIsCapturing(true)
    setTimeout(() => {
      onCaptureSuccess()
    }, 450)
  }

  // Mode 1: Choice Sheet Modal
  if (mode === "choice") {
    return (
      <div className="cf-sheet-overlay" role="dialog" aria-modal="true">
        <button
          aria-label="Close capture sheet"
          className="absolute inset-0 cursor-default bg-transparent border-0"
          onClick={onDismiss}
          type="button"
        />

        <section className="cf-sheet-drawer">
          <div className="cf-drag-handle" />

          {/* Header */}
          <div className="cf-sheet-header">
            <div>
              <h2 className="cf-header-title">{locationTitle}</h2>
              <p className="cf-header-sub">{distanceLabel}</p>
            </div>

            <div className="cf-reward-badge" aria-label={`Reward: +${rewardCoins} coins`}>
              <span className="cf-coins-icon" />
              <span>+{rewardCoins} coins</span>
            </div>
          </div>

          <div className="cf-options-label">Select Capture Method</div>

          {/* Option Cards */}
          <div className="cf-options-grid">
            {/* Option A: AR 3D Camera Capture */}
            <button
              className="cf-option-card ar-option"
              onClick={() => setMode("ar-camera")}
              type="button"
            >
              <span className="cf-ar-badge">⭐ 3D Experience</span>
              <div className="cf-card-icon-wrap">
                <span>📹</span>
              </div>
              <div className="cf-card-content">
                <h3 className="cf-card-title">3D Camera Capture</h3>
                <p className="cf-card-desc">
                  Open outdoor view & tap the floating 3D flag to claim coins
                </p>
              </div>
              <span className="cf-card-arrow">›</span>
            </button>

            {/* Option B: Instant Direct Capture */}
            <button
              className="cf-option-card instant-option"
              onClick={onCaptureSuccess}
              type="button"
            >
              <div className="cf-card-icon-wrap">
                <span>⚡</span>
              </div>
              <div className="cf-card-content">
                <h3 className="cf-card-title">Instant Check-In</h3>
                <p className="cf-card-desc">
                  One-tap quick capture at your current location
                </p>
              </div>
              <span className="cf-card-arrow">›</span>
            </button>
          </div>
        </section>
      </div>
    )
  }

  // Mode 2: AR Viewfinder with Outdoor Video Backdrop & 3D Interactive Flag
  return (
    <div className="cf-ar-viewport" role="dialog" aria-modal="true">
      {/* Background Outdoor Video (or Simulated Outdoor Scenery Backdrop) */}
      {videoSrc ? (
        <video
          autoPlay
          className="cf-video-feed"
          loop
          muted
          onTimeUpdate={(e) => {
            if (e.currentTarget.currentTime >= 4) {
              e.currentTarget.currentTime = 0
            }
          }}
          playsInline
          src={videoSrc}
        />
      ) : (
        <div className="cf-simulated-camera">
          {/* Animated Outdoor Vineyard / Trail View Backdrop */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000"
            style={
              {
                backgroundImage:
                  "radial-gradient(circle at 50% 30%, rgba(255, 235, 170, 0.45) 0%, transparent 60%), linear-gradient(180deg, #38bdf8 0%, #7dd3fc 35%, #84cc16 65%, #4d7c0f 100%)",
              } as CSSProperties
            }
          >
            {/* Sun Rays & Vineyard Rolling Hills */}
            <div
              className="absolute inset-0 opacity-40 mix-blend-overlay"
              style={{
                backgroundImage:
                  "repeating-radial-gradient(circle at 50% 25%, #ffffff 0, #ffffff 15px, transparent 16px, transparent 40px)",
              }}
            />
            {/* Outdoor Horizon Contour */}
            <div
              className="absolute inset-x-0 bottom-0 h-1/2 opacity-70"
              style={{
                background:
                  "radial-gradient(ellipse 90% 70% at 50% 100%, #15803d 0%, #14532d 60%, transparent 100%)",
              }}
            />
          </div>
          <div className="cf-camera-grid" />
        </div>
      )}

      {/* Hidden File Input for Custom Video Upload (Demonstration Feature) */}
      <input
        accept="video/*"
        aria-hidden="true"
        className="hidden"
        onChange={handleVideoUpload}
        ref={fileInputRef}
        style={{ display: "none" }}
        type="file"
      />

      {/* Top AR Navigation & Status HUD */}
      <header className="cf-ar-top-bar">
        <div className="cf-ar-live-tag">
          <span className="cf-live-pulse" />
          <span>OUTDOOR AR • {locationTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="cf-btn-cancel-permission text-xs px-3 py-1.5 h-auto rounded-full bg-black/40 border border-white/20 text-white hover:bg-black/60"
            onClick={() => fileInputRef.current?.click()}
            title="Upload custom outside video for demonstration"
            type="button"
          >
            🎥 Custom Video
          </button>

          <button
            aria-label="Exit AR camera view"
            className="cf-ar-close-btn"
            onClick={() => setMode("choice")}
            type="button"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Center 3D Stage with Floating Interactive 3D Flag */}
      <main className="cf-ar-stage">
        {/* AR Viewfinder Reticle */}
        <div className="cf-ar-reticle">
          <span className="cf-bracket tl" />
          <span className="cf-bracket tr" />
          <span className="cf-bracket bl" />
          <span className="cf-bracket br" />
        </div>

        {/* The 3D Interactive Target Button */}
        <button
          aria-label="Tap 3D Flag to capture and collect coins"
          className="cf-3d-interactive-target"
          onClick={handle3DFlagTap}
          style={
            isCapturing
              ? {
                  transform: "scale(1.3) rotateY(180deg)",
                  opacity: 0,
                  transition: "all 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
                }
              : undefined
          }
          type="button"
        >
          {/* 3D Tomoboshi Star Coin with Smiling Face */}
          <StarCoin3D />
        </button>
      </main>

      {/* Bottom AR Action Bar with Capture Button */}
      <footer className="cf-ar-bottom-bar">
        <button
          aria-label="Capture Flag"
          className="cf-ar-capture-btn"
          disabled={isCapturing}
          onClick={handle3DFlagTap}
          type="button"
        >
          Capture
        </button>
      </footer>
    </div>
  )
}
