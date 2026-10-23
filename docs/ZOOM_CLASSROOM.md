# Zoom Classroom prototype

## Architecture

- Zoom Meeting SDK Web 6.5.0 Component View runs in an isolated same-origin
  HTML frame. The CDN build is intentional: the npm package requires React
  18.3.1 while this app uses React 19.
- Next.js verifies the WEWIN session and classroom membership before issuing a
  Meeting SDK signature.
- Host mode requires a Zoom ZAK fetched server-side through a Server-to-Server
  OAuth app. OAuth access tokens are never returned to the browser. The
  short-lived host ZAK is returned only to the authorized host because Zoom's
  browser SDK requires it in `client.join()`.
- Ably Free carries subscribe-only presentation events. Postgres remains the
  source of truth; clients poll after reconnect and when Ably is not configured.
- WEWIN presentations use a manifest of individual image URLs. Google Slides
  embeds cannot expose or synchronize their current page across origins.

## Admin-managed Zoom accounts (recommended)

Admins connect Zoom accounts at **/admin/zoom**; credentials are stored in the
`ZoomAccount` table with secrets AES-GCM encrypted by
`CLASSROOM_SECRET_ENCRYPTION_KEY`. Each account needs, in the same Zoom account:

1. A **Server-to-Server OAuth** app with scopes `meeting:write:meeting:admin`,
   `meeting:update:meeting:admin`, `meeting:delete:meeting:admin`,
   `meeting:read:meeting:admin`, `user:read:zak:admin` (plus
   `user:read:token:admin` when the host user is not the account owner).
2. A **Meeting SDK** app (SDK Key / SDK Secret).

**/admin/classes** (ADMIN; TEACHER for assigned classes) creates classes,
assigns teachers/students (auto-enrolled from `User.classCode`) and schedules
sessions. Creating a session calls Zoom to create the meeting (type 2), or a
recurring meeting with fixed time (type 8) whose occurrences map 1:1 to
`LiveSession` rows sharing a `seriesId`. Editing/deleting a session updates or
deletes the meeting/occurrence on Zoom. A class's Zoom account only applies to
new sessions; existing sessions keep `LiveSession.zoomAccountId`.

Sessions without `zoomAccountId` (seeded/manual) keep using the env
credentials below, falling back to the default DB account.

## Legacy env-based Zoom setup

1. Create a **Meeting SDK** app in the Zoom account that owns the prototype
   meeting. Add `ZOOM_MEETING_SDK_KEY` and `ZOOM_MEETING_SDK_SECRET` to local
   and Vercel server environments.
2. If the teacher will host inside WEWIN, create a **Server-to-Server OAuth**
   app in the same account with scope `user:read:zak:admin`, then configure
   `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID` and `ZOOM_CLIENT_SECRET`. The host is the
   account owner (`GET /v2/users/me/zak`). To host as another user in the
   account, set `ZOOM_HOST_USER_ID` and add scope `user:read:token:admin`.
3. Create one Basic meeting manually. Keep authentication requirements off if
   students must join without Zoom accounts. A waiting room and passcode are
   supported.

Zoom Basic currently supports up to 100 participants and limits ordinary group
meetings to 40 minutes. Component View is a desktop-browser experience. Mobile
learners receive the meeting number/passcode and an **Open Zoom app** fallback.

## Ably setup

1. Create an Ably Free app (no credit card required for the free package).
2. Create a key that can publish and issue tokens.
3. Add the key as `ABLY_API_KEY` on the server only.

Clients never receive the API key. The token endpoint issues a one-hour token
with subscribe-only capability for exactly one `classroom:{sessionId}` channel.
The free package supports 200 concurrent connections and 6 million messages per
month.

## Database and prototype seed

Apply the migration:

```powershell
npx prisma migrate deploy
npx prisma generate
```

Generate a long `CLASSROOM_SECRET_ENCRYPTION_KEY`, configure the prototype
variables listed in `.env.example`, then seed the room:

```powershell
npm run seed:classroom
```

`CLASSROOM_SLIDES_JSON` must be a JSON array:

```json
[
  {
    "id": "slide-1",
    "imageUrl": "https://media.example.com/class/slide-1.webp",
    "alt": "Lesson introduction"
  }
]
```

Upload slide images to R2/CDN before seeding. Do not put meeting passcodes,
OAuth tokens, ZAK tokens, or API keys in Git, URLs, logs, or presentation
manifests.

## Browser acceptance

- Chrome and Edge desktop: camera, microphone, Component View, teacher screen
  share, reconnect.
- Safari desktop: join/receive and current Zoom screen-share limitations.
- Mobile/tablet: Zoom app fallback (Component View is not supported).
- Student in assigned class can join; wrong-class student and `VISITOR` cannot.
- Only assigned `HOST` teacher or admin can receive role 1 and control slides.
- Late join and reconnect load the durable presentation state and ignore older
  versions.

When hosts move outside the Meeting SDK app owner's Zoom account, Zoom requires
reviewed OAuth/OBF/ZAK authorization. Treat that as a separate production
multi-account project, not as a credential-only change.
