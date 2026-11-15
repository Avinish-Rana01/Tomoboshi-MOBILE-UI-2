# AR Spatial Anchoring Simulation Specification

> **Document Purpose**: Blueprint for simulating realistic surface-anchored AR (Amazon "View in Your Room" style) within the React + Tailwind prototype for client presentations and Flutter mobile development handoff.

---

## 1. Executive Summary & Objective

In production Flutter apps, AR experiences utilize **ARKit (iOS)** and **ARCore (Android)** plane-detection and feature-point tracking to anchor 3D objects (`.glb` / SceneKit / Filament) onto real-world surfaces.

In this React prototype, our objective is **high-fidelity visual simulation**:
- Create an identical visual result for client demo recordings and stakeholder reviews.
- Avoid bulky, fragile WebXR/SLAM browser requirements.
- Deliver exact spatial motion, scaling curves, and perspective angles to the Flutter development team as a production reference.

---

## 2. The Amazon "View in Your Room" Paradigm

When viewing a product (e.g., a keyboard or decorative item) in Amazon's AR preview:
1. **Fixed World Anchor**: Once placed on a table or floor, the object remains pinned to that physical coordinate.
2. **Proximity Zoom (Scale & Detail)**:
   - Walking closer causes the model to naturally enlarge, exposing micro-details (e.g., keycaps, texture reflections).
   - Backing away reduces its visual footprint proportionally.
3. **Orbital Perspective (Multi-Angle Parallax)**:
   - Stepping to the left or right rotates the view around the object, exposing its side profiles (e.g., the depth of the flagpole, the back bevel of the chest).
4. **Surface Grounding**:
   - A soft occlusion shadow under the object stays grounded on the surface plane, locking the object into the environment's lighting.

---

## 3. Video Timestamp-Linked Spatial Keyframing

To simulate surface anchoring over a pre-recorded camera video feed, the 3D model's CSS 3D transforms (`scale3d`, `translate3d`, `rotateY`, `rotateX`) are dynamically driven by `video.currentTime`.

### 3.1 Timeline Keyframe Mapping Matrix

| Time Window | Camera Movement in Video | 3D Model Scale | Rotation Y (Pan/Orbit) | Translation (X, Y) | Visual Effect |
|:---|:---|:---|:---|:---|:---|
| **0.0s – 1.0s** | Initialization / Settle | `1.00x` | `0°` (Front) | `(0px, 0px)` | Flag appears anchored in front of viewer |
| **1.0s – 3.0s** | Walking Backward (Distant) | `1.00x → 0.65x` | `0° → -15°` | `(0px, +20px)` | Model shrinks into the background space |
| **3.0s – 5.0s** | Stationary Inspection | `0.65x` | `-15° → +15°` | `(0px, +20px)` | Subtle idle sway while user pauses |
| **5.0s – 7.0s** | Walking Forward (Approach) | `0.65x → 1.45x` | `+15° → 0°` | `(0px, -30px)` | Model expands dramatically; detail reveals |
| **7.0s – 9.0s** | Orbiting Left of Flag | `1.45x → 1.20x` | `0° → +55°` | `(-40px, -15px)` | Viewing flag from the side angle (rod profile) |
| **10.0s – 11.0s** | Orbiting Right / Re-centering | `1.20x → 1.00x` | `+55° → -30°` | `(+30px, 0px)` | Sweeping perspective around opposite side |

---

## 4. Technical Architecture in React (`src/CaptureFlow.tsx`)

### 4.1 Smooth Interpolation Engine
Instead of rigid jumps, a `requestAnimationFrame` loop calculates linear or ease-out interpolation (`lerp`) between keyframes based on `video.currentTime`:

```typescript
interface SpatialKeyframe {
  timestamp: number // in seconds
  scale: number
  rotateY: number   // in degrees
  rotateX: number
  translateX: number // in pixels
  translateY: number
}

// Cubic bezier or lerp interpolation between adjacent keyframe nodes
function interpolateTransform(currentTime: number, keyframes: SpatialKeyframe[]) {
  // Find surrounding keyframe pair and compute fractional progress t
  // Return interpolated scale, rotation, and translation values
}
```

### 4.2 Dynamic Surface Ground Shadow
A dedicated shadow element beneath the 3D model scales inversely with simulated elevation and matches proximity:
- When close (`scale > 1.2`): Shadow becomes crisper and darker (`opacity: 0.6`, `blur: 12px`).
- When far (`scale < 0.8`): Shadow softens and lightens (`opacity: 0.3`, `blur: 24px`).

---

## 5. Flutter Mobile Hand-Off Specifications

For the Flutter mobile team integrating ARKit / ARCore via packages such as `ar_flutter_plugin` or `flutter_unity_widget`:

1. **Model Format**: `.glb` (glTF 2.0 Binary) containing PBR materials (metallic roughness workflow for the gold leaf).
2. **Anchor Placement**:
   - `ARPlaneAnchor` detected via horizontal plane search (`PlaneType.horizontalUpwardFacing`).
   - Default physical bounding box: `0.35m x 0.35m x 0.60m` (roughly 14 inches high on a tabletop or trail marker).
3. **Interactive Touch Raycasting**:
   - Single tap on the AR node bounding box dispatches `onNodeTap`.
   - Triggers native haptic vibration (`HapticFeedback.heavyImpact()`) and fires the coin celebration overlay.
4. **Fallback Mode**:
   - If device lacks ARKit/ARCore support (or permissions denied), fallback to the 2D Instant Capture bottom sheet with the classic reward pill.

---

## 6. Verification & State Checklist

- [x] **Classic Gold Design (1/15)** locked as permanent default.
- [x] **Side navigation slide arrows removed** from map viewport.
- [x] **AR Viewfinder Feature Card** harmoniously integrated into the bottom sheet.
- [x] **Zero accidental code mutations** without explicit user sign-off.
- [x] **Specifications documented** in root [`docs/ar-spatial-simulation-spec.md`](file:///c:/Users/asust/Downloads/Add%20coins%20display%20element%20(3)/docs/ar-spatial-simulation-spec.md).
