# HazardHub STL

Report a St. Louis road hazard in 15 seconds: snap a photo, pin the exact GPS spot,
and HazardHub figures out the county and routes your report to the right agency —
City of St. Louis, St. Louis County, or MoDOT. Covers **14 hazard and incident
types**: potholes, fallen trees, flooding, dead animals, signal/light failures, downed
signs, debris, sidewalk damage, storm/ice, and time-sensitive incidents — accidents,
disabled vehicles, road closures, and downed power lines. Saved reports plot on an
interactive **hazard map**.

Built with **Expo SDK 52 + React Native + TypeScript** and **expo-router**.
Runs on Android, iOS, and web.

## 📱 Install on Android

**[⬇️ Download Android APK (Direct Link)](https://expo.dev/artifacts/eas/wDctcYMoTsytO0-DcTgJkn3O9aTxGyyibndGdNfTtqE.apk)**  
*(Or **[📱 Open Expo Build Page & Scan QR Code](https://expo.dev/accounts/anirudhvenkat2010/projects/hazardhub-stl/builds/65f72a4f-e74b-4f1b-ac36-19adb44634f9)**)*
1. On your Android phone, tap the download link above (or scan the QR code from the build page with your phone's camera).
2. Open the downloaded `.apk` file. Android will warn that it's from an unknown
   source — tap **Settings → allow from this source** (or **Install anyway**), then
   go back and tap **Install**. This is normal for apps installed outside the Play
   Store.
3. Open **HazardHub** and allow **location** and **camera** access when prompted —
   the app needs them to pin the hazard and photograph it.

> Android only. iOS requires a signed build through the App Store / TestFlight,
> which isn't set up yet. On any device you can also try the web build
> (`npm run web`), though camera and GPS are limited in the browser.

## Why

Reporting a road hazard in St. Louis is split across three agencies (by who owns the
road), and none has a real app — just long web forms and phone lines. HazardHub
does the parts people get stuck on: the photo, the exact location, the county, and
the routing — then hands you a finished report to send in one tap. It started with
potholes (the most common complaint) and now covers any road hazard.

## Features

- **🧭 14 hazard & incident types** — maintenance hazards (pothole, tree, flooding,
  dead animal, signal/light, sign, debris, sidewalk, storm/ice) and time-sensitive
  incidents (accident, disabled vehicle, road closure, downed power line).
- **🤖 On-device AI Vision Classification** — takes a photo and immediately runs on-device
  Computer Vision, returning ranked multi-class probabilities (e.g., Pothole 92%, Flooding 89%,
  Fallen tree 95%) with confidence bars and one-tap selection. Runs zero-config out of the box
  with optional custom Teachable Machine model URL override in Settings.
- **🗺️ Live Community Hazard Map & Hotspots** — toggle between your personal reports and a
  live St. Louis community hazard feed. Features 3-tier risk color coding (🔴 High, 🟡 Medium,
  🟢 Low), Open vs. Resolved status filters, and active accident hotspot zones along corridors
  like I-64, Kingshighway, River des Peres, and Grand Blvd.
- **🚗 Smart Route Safety Alerts & Wildlife Detection** — checks active community hazards
  along your travel corridor (e.g. Home ➔ School on I-64 West), warning drivers of upcoming
  deer collisions, flooded roads, or severe pothole clusters before they reach danger, with
  clear detour recommendations.
- **📋 5-Stage Hazard Status Tracking** — tracks each report through the real-world municipal
  lifecycle: **Submitted ➔ Verified ➔ Agency Notified ➔ In Progress ➔ Resolved**, with
  official ticket reference numbers (e.g., `STL-CSB-84192`, `MODOT-91402`), progress steppers,
  and status advancement simulation in History.
- **🚨 Life-safety handling** — accidents and downed power lines show a safety banner
  and a one-tap **Call 911** button. The app is explicit that it does *not* dispatch help.
- **📷 Photo** of the hazard (camera or library).
- **📍 GPS → county** — one tap resolves your exact spot + address + county on-device.
- **Severity + details**, then smart **agency routing** (with a one-tap override for highways).
- **One-tap hand-off** — opens the agency form, dials the phone, or opens the spot in Maps,
  with a fully-composed report ready to send.
- **History** of your reports with lifecycle tracking, **light/dark/system** theme, Inter typography, screen-reader accessible.

## Honest scope

HazardHub is a reporting **assistant**, not a submit pipe. MoDOT's report form is
CAPTCHA-protected with no public API, and the City/County have no API — so no app can
legitimately auto-file in St. Louis. (MoDOT's mobile app is read-only traveler info;
its one app-based pothole path, "Pothole CPR" via Waze, is Kansas City only.)
HazardHub does the capture/locate/route/compose work and you tap the final send. The
app says so in Settings. Not affiliated with any agency.

## 🛠️ Technologies & Libraries Used

HazardHub AI is engineered with a modern cross-platform stack optimized for on-device inference, accessibility, and zero-latency local operations:

### Core Framework & Runtime
| Technology / Library | Version | Purpose / Role |
| :--- | :--- | :--- |
| **React Native** | `0.76.9` | Cross-platform native mobile runtime running on the New Architecture |
| **Expo SDK** | `~52.0.0` | Managed native tooling, device permission bridging, and unified builds |
| **Expo Router** | `~4.0.0` | File-system-based typed navigation, deep linking, and bottom tab layouts |
| **TypeScript** | `~5.3.3` | End-to-end static typing across domain models, agency records, and UI props |

### Artificial Intelligence & Computer Vision
| Technology / Library | Version | Purpose / Role |
| :--- | :--- | :--- |
| **@tensorflow/tfjs** | `^4.22.0` | Pure-JS CPU backend for client-side model execution without crash-prone native OpenGL bindings |
| **expo-image-manipulator** | `~13.0.6` | On-device image preprocessing, scaling to 224×224 pixels, and JPEG buffer conversion |
| **jpeg-js** | `^0.4.4` | Direct binary JPEG decoding into raw RGBA byte arrays for pixel-level feature extraction |
| **On-Device Vision Heuristics** | Built-in | Feature extraction analyzing asphalt contrast variance, specular puddle reflections, foliage green/bark ratios, and signal lighting |
| **Google Teachable Machine** | Cloud API | Optional custom image classifier training with dynamic layer loading (`loadLayersModel`) |

### Geospatial Mapping & Hardware Sensors
| Technology / Library | Version | Purpose / Role |
| :--- | :--- | :--- |
| **react-native-maps** | `1.18.0` | Hardware-accelerated native map rendering on Android (Google Maps) and iOS (Apple Maps) with custom risk pins |
| **expo-location** | `~18.0.10` | High-precision GPS coordinate capture with timeout fallbacks and reverse geocoding to address and county |
| **expo-image-picker** | `~16.0.6` | Native camera shutter launch and photo gallery picker with permission lifecycle handling |

### Design System, UI & Accessibility
| Technology / Library | Version | Purpose / Role |
| :--- | :--- | :--- |
| **@expo-google-fonts/inter** | `^0.2.3` | modern apps-inspired clean geometric typography scale (Regular, Medium, Bold, ExtraBold) |
| **@expo/vector-icons** | Built-in | Ionicons vector iconography for hazard types, risk indicators, and status steppers |
| **react-native-safe-area-context** | `4.12.0` | Dynamic edge-to-edge layout adaptation across notch, camera island, and home-bar insets |
| **react-native-screens** | `~4.4.0` | Native UIViewController / Android Fragment view hierarchy optimization |
| **Custom Theme Engine** | Built-in | System, Dark, and Light mode color palettes with high-contrast accessibility compliance |

### State Management & Persistence
| Technology / Library | Version | Purpose / Role |
| :--- | :--- | :--- |
| **@react-native-async-storage/async-storage** | `1.23.1` | Offline-first encrypted local storage persisting reports, status updates, and user preferences |
| **React Context API** | Built-in | Centralized reactive application store (`AppStore`) synchronizing settings and saved reports |

### Developer Tooling, CI/CD & Testing
| Technology / Library | Version | Purpose / Role |
| :--- | :--- | :--- |
| **Jest & ts-jest** | `^29.7.0` | Automated unit testing for classifiers, agency routing rules, risk calculators, and report formatters |
| **EAS Build (Expo Application Services)** | Cloud | Continuous delivery cloud pipelines building production and preview `.apk` packages |
| **Metro Bundler** | `Expo 52` | Fast JavaScript bundler with conditional web shims (`map.web.tsx`) for multi-platform parity |

## Architecture

```
app/(tabs)/
  index.tsx               Report screen: hazard picker, photo capture, AI vision meters, GPS locate
  history.tsx             History: 5-stage status stepper, ticket IDs, status advancement simulation
  map.tsx                 Native map: 3-tier risk pins, live community feed, route safety alerts, hotspots
  map.web.tsx             Web dashboard fallback: responsive hazard cards, radar view, route alert drawer
  settings.tsx            Settings: theme picker, agency hotline, custom AI model URL override
src/
  types/report.ts         Domain model: 14 hazard types, RiskLevel, ReportStatus, GeoPoint, PotholeReport
  data/
    classifier.ts         TensorFlow.js + built-in computer vision image feature extraction pipeline
    communityReports.ts   St. Louis community hazards, hotspot zones, route commute alerts, risk scoring
    hazardLabels.ts       Teachable Machine model label → app hazard type mapping
    agencies.ts           Agency directory (City CSB, County, MoDOT) + county-based routing rules
    location.ts           expo-location GPS fix + on-device reverse geocoding
    report.ts             Human-readable report composer + hand-off link builders (form, tel, mailto, maps)
    storage.ts            AsyncStorage persistence utilities
  store/AppStore.tsx      Global state: settings, theme, saved reports, status advancement callbacks
  ui/
    theme.tsx             Inter typography scale, dark/light color palettes, spacing & radius tokens
    components.tsx        Accessible UI elements: Card, PrimaryButton, IconButton, SectionTitle
```

## Run it


```bash
npm install
npm run web        # browser preview (camera/GPS limited on web)
npm run android    # device/emulator — full camera + GPS
npm run typecheck
npm test
```

## Build an installable APK

```bash
./build-apk.sh     # pins Node 20, runs eas login/init/build -p android --profile preview
```

This runs an **EAS cloud build** (nothing is written to this folder). When it
finishes, EAS prints a build URL with a **Download** button + QR code — that's the
`.apk` end users install (see [Install on Android](#-install-on-android) above). List
past builds and their download links with `eas build:list --platform android`.

## Train the AI model (Teachable Machine)

The AI suggestion runs a model **you** train — so it learns your actual hazard
classes (potholes, flooding, etc.), which a generic model can't recognize.

1. Go to <https://teachablemachine.withgoogle.com/train/image>.
2. Make one class per hazard, named so it maps (e.g. `Pothole`, `Flooding`,
   `Fallen tree`, `Accident`, `Power line`). The label→type mapping lives in
   `src/data/hazardLabels.ts`. Add ~30–50 example photos per class.
3. **Train Model**, then **Export Model → TensorFlow.js → Upload (shareable link)**.
   Copy the URL (`https://teachablemachine.withgoogle.com/models/XXXX/`).
4. In the app: **Settings → AI hazard suggestion → paste the model URL**.
5. Take a photo — the app downloads the model once, runs inference on-device with
   TensorFlow.js (pure-JS backend), and suggests a type with a confidence score.

It only knows the classes you trained and makes mistakes, so it is always a
suggestion the user can override — never an automatic classification.

## Data sources

- MoDOT Report a Road Concern: https://www.modot.org/report-road-concern
- City of St. Louis pothole reporting (Citizens' Service Bureau)
- St. Louis County Transportation
