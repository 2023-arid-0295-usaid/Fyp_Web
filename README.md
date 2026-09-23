# FYP Web — Next.js clone of `myFypProject`

A **Next.js 15 (App Router, JavaScript)** re-implementation of the
`myFypProject` React Native app, built to talk to the **existing ASP.NET Core
backend** (`Fyp_Backend`). The clone reproduces the original app's architecture
— same screens, same 4 roles, **same API endpoints / payloads / calling
conventions**, and **same localStorage keys** that the React Native app stored
in AsyncStorage.

> The backend is **not** embedded here. This project only replaces the React
> Native front-end (client + worker + company + police UIs) with a browser app
> that keeps calling the same external API.

---

## 1. What maps to what

| React Native (original)                          | This repo (Next.js App Router)           |
| ------------------------------------------------ | ---------------------------------------- |
| `App.tsx` `Stack.Screen` registry                | `src/app/**/page.jsx` routes             |
| `assets/config.js`                               | `src/lib/config.js`                      |
| `assets/components/**/*.js` screens              | `src/components/**/*.jsx`                |
| `AsyncStorage`                                   | `localStorage` via `src/lib/storage.js`  |
| `NotificationHelper` (react-native-toast-message) | `src/components/Toast/Toast.js`          |
| `react-native-vector-icons/MaterialCommunityIcons` | `src/components/Icon/Icon.jsx` (`@mdi/js`) |
| `assets/images/**`                               | `public/images/**`                       |
| `Map.js` Leaflet WebView                         | `src/components/Map/Map.jsx` (iframe + Leaflet CDN) |

### Route map (aliases kept for traceability)

| App.tsx screen name                | Route                                        |
| ---------------------------------- | -------------------------------------------- |
| `Login`                            | `/login`                                     |
| `Signup`                           | `/signup`                                    |
| `AddSkills`                        | `/worker/add-skills`                         |
| `FindServiceScreen`                | `/find-service`                              |
| `UserDashboardScreen`              | `/client/dashboard`                          |
| `FilterationScreen`                | `/client/filteration`                        |
| `WorkerDetailScreen`               | `/client/worker-detail`                      |
| `InterviewSelectionScreen`         | `/client/interview`                          |
| `ActiveRequestScreen`              | `/client/active-requests`                    |
| `WorkerDecisionScreen`             | `/client/worker-decisions`                   |
| `ResignationsScreen`               | `/client/resignations`                       |
| `ResignationScreen`                | `/client/resignation-detail`                 |
| `TerminateContractScreen`          | `/client/terminate`                          |
| `RatingAndReviewsScreen`           | `/client/rating-reviews`                     |
| `WorkerCertificationDetail`        | `/client/certification`                      |
| `ClientProfileScreen`              | `/client/client-profile`                     |
| `WorkerDashboardScreen`            | `/worker/dashboard`                          |
| `ActiveRequestsScreen`             | `/worker/active-requests`                    |
| `AcceptedRequestScreen`            | `/worker/accepted-requests`                  |
| `JobConfirmationScreen`            | `/worker/job-confirmations`                  |
| `LeaveJobScreen`                   | `/worker/leave-job`                          |
| `WorkerRatingAndReviewsScreen`     | `/worker/rating-reviews`                     |
| `WorkerTerminationScreen`          | `/worker/termination-status`                 |
| `WorkerTerminatedScreen`           | `/worker/terminated`                         |
| `WorkerDirectoryScreen`            | `/company/directory`                         |
| `WorkerDetailsVerificationScreen`  | `/company/worker-details-verification`       |
| `PoliceVerificationPortal`         | `/police/portal`                             |
| `FileCriminalRecordScreen`         | `/police/file-criminal-record`               |
| `MapScreen`                        | `/map`                                       |

---

## 2. Requirements

- **Node.js 18.18+** (tested on v20)
- A running instance of the ASP.NET Core backend (see `Fyp_Backend`). The
  default base URL is `http://192.168.100.13/Fyp_Backend` — change it in
  `.env.local` to match your machine.

---

## 3. Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure the backend URL (copy the example, then edit)
cp .env.example .env.local
#    → set NEXT_PUBLIC_API_BASE to your backend, e.g.
#      NEXT_PUBLIC_API_BASE=http://192.168.100.13/Fyp_Backend

# 3. Run the dev server
npm run dev
#    → open http://localhost:3000

# Production build + serve
npm run build
npm run start
```

---

## 4. Backend integration (identical endpoints & payloads)

All calls go through the same endpoints the React Native app used:

| Area        | Base URL (from `src/lib/config.js`)      |
| ----------- | ---------------------------------------- |
| Dashboard   | `${SERVER_BASE}/api/Dashboard`           |
| Auth        | `${SERVER_BASE}/api/Auth`                |
| Account     | `${SERVER_BASE}/api/AccountCreation`     |
| Directory   | `${SERVER_BASE}/api/CompanyDirectory`    |
| Police      | `${SERVER_BASE}/api/Police`              |

Key calls preserved exactly:

- **Login** — `POST /api/Auth/Login`, payload `{ Role, EmailOrCnic, Password }`.
  Response id is stored under the same AsyncStorage keys
  (`userToken`, `userRole`, `userName`, `userPicture`, `clientId`,
  `workerId`, `companyId`, `policeId`, …). Role → route redirects:
  Client → `/find-service`, Worker → `/worker/dashboard`,
  Company → `/company/directory`, Police → `/police/portal`.
- **Signup / profile edit** — multipart `FormData` to
  `AccountCreation/Signup{Client,Worker,Company}` or
  `Update{Client,Worker,Company}`; worker signup sends `experiencesJson` and the
  picked location.
- **Location** — worker `PUT /api/Dashboard/UpdateWorkerLocation`; client
  `POST /api/Dashboard/update-location`.
- **Find service** — `GET /api/Dashboard/GetWorkersForClient` with
  `search`, `categories`, `gender`, `city`, `subSkills` query params.
- **Worker detail** — `GET /api/Dashboard/GetWorkerDetail/{id}?clientIdParam=`; reviews via
  `GET /api/Dashboard/GetWorkerReviews/{id}` (the correct route — the RN
  original mistakenly pointed its worker dashboard at a non-existent
  `/api/RatingReview/...`, fixed for this clone).
- **Interview / hiring** — `POST /api/Dashboard/BookInterview`,
  `GET /api/Dashboard/GetActiveRequests/{clientId}`,
  `POST /api/Dashboard/CreateHiring`, `DELETE /api/Dashboard/DeleteInterviewRequest/{id}`,
  `GET /api/Dashboard/GetClientWorkerDecisions`, `POST /api/Dashboard/FinalizeHiringDecision`.
- **Worker side** — `GET /api/Dashboard/GetWorkerRequests`,
  `GET /api/Dashboard/GetAcceptedWorkerRequests`,
  `PUT /api/Dashboard/UpdateWorkerDecision/{id}`,
  `GET /api/Dashboard/GetWorkerJobConfirmations`,
  `PUT /api/Dashboard/WorkerAcceptJobOffer/{id}` / `WorkerRejectJobOffer/{id}`,
  `DELETE /api/Dashboard/ClientDismissWorkerRejection/{id}`.
- **Resignation / termination** — `POST /api/Dashboard/SubmitResignation`,
  `POST /api/Dashboard/SubmitWorkerReviewToClient`,
  `GET /api/Dashboard/GetActiveJob/{workerId}`,
  `POST /api/Dashboard/TerminateContract`,
  `GET /api/Dashboard/GetLatestTermination/{workerId}`,
  `GET /api/Dashboard/GetWorkerEndContractDetails/{workerId}`,
  `GET /api/Dashboard/GetClientResignations`,
  `GET /api/Dashboard/GetResignationDetail/{id}`,
  `POST /api/Dashboard/ConfirmResignation`.
- **Worker slots** — `GET /api/WorkerSlots/GetWorkerTimeSlots/{id}`,
  `POST /api/WorkerSlots/AddTimeSlot`, `DELETE /api/WorkerSlots/DeleteTimeSlot/{id}`.
- **Duty / radius** — `PUT /api/Dashboard/UpdateDutyStatus/{id}`,
  `PUT /api/Dashboard/UpdateWorkerRadius/{id}`.
- **Company** — `GET /api/CompanyDirectory/GetAllWorkers`,
  `GET /api/CompanyDirectory/GetCompanyProfile?companyId=`,
  `GET /api/CompanyDirectory/GetWorkerDetails/{id}`,
  `POST /api/CompanyDirectory/IssueCertificate`,
  `GET /api/CompanyDirectory/GetWorkerCertificateDetail/{id}`.
- **Police** — `GET /api/Police/GetWorkersForVerification?searchCnic=`,
  `GET /api/Police/GetWorkerDetails/{id}`,
  `POST /api/Police/FileCriminalRecord`.

---

## 5. Environment variables (`.env.example`)

| Variable                        | Purpose                                        | Default                          |
| ------------------------------- | ---------------------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_API_BASE`          | Backend base URL (must start with `http(s)://`) | `http://192.168.100.13/Fyp_Backend` |
| `NEXT_PUBLIC_MAP_FALLBACK_LAT`  | Map fallback center latitude                    | `33.6844` (Rawalpindi)           |
| `NEXT_PUBLIC_MAP_FALLBACK_LNG`  | Map fallback center longitude                   | `73.0479` (Rawalpindi)           |

> Because the browser and the backend are different hosts, the backend must
> allow cross-origin requests from the app. The original backend already
> applied CORS (see `Fyp_Backend/Program.cs`).

---

## 6. Notes & fixes applied during the port

1. **Worker reviews route bug** — `WorkerDashboardScreen` in the RN app fetched
   `/api/RatingReview/GetWorkerReviews/{id}`, which does not exist in the
   backend. The clone calls `/api/Dashboard/GetWorkerReviews/{id}`.
2. **Police record dead link** — `WorkerDetailScreen`'s "Criminal Background
   Check" navigated to a `workerPoliceRecord` screen that was never registered.
   The backend has no GET endpoint for a worker's police record (only
   `FileCriminalRecord` writes one), so the clone keeps the card but routes it
   to the worker-detail screen with an explanatory subtitle.
3. **`TerminateContractScreen` payload** — kept identical (`InterviewId`,
   `Reason`, `Remarks`, `Rating`).
4. **`ClientProfileScreen`** — the original called an out-of-scope `Toast.show`
   in one branch; fixed to use the clone's toast hook.

---

## 7. Project layout

```
fyp-web/
├─ package.json          # next ^15.3.3, react 19, @mdi/js
├─ next.config.mjs
├─ jsconfig.json         # "@/*" → "src/*"
├─ eslint.config.mjs
├─ .env.example          # documented env template
├─ .env.local            # runtime env (default backend URL)
├─ public/images/        # logo.png, default-user.png (from original assets)
└─ src/
   ├─ app/               # App Router routes (one page per RN screen)
   ├─ lib/               # config, api, storage, locationHelper, utils
   └─ components/        # Auth, Client, Worker, Company, Police, Map, Toast, Icon, Platform
```
