# Uploads & Image Management

This document covers the upload pipeline, avatar system, Cloudflare Image Transformations, and R2 bucket configuration.

## Architecture Overview

```
User → Frontend → Presigned URL API → R2 Direct Upload → Complete API → DB Record
                                                                         ↓
                                                              Avatar PATCH → user.image
```

All file uploads use **presigned URLs** for direct browser-to-R2 uploads, bypassing Worker body-size limits.

---

## Upload Pipeline

### 1. Request Presigned URL

```
POST /api/v1/orgs/:organizationId/uploads
```

**Body:**
```json
{
  "originalName": "photo.jpg",
  "contentType": "image/jpeg",
  "fileSize": 204800
}
```

**Response (201):**
```json
{
  "uploadId": "abc123",
  "presignedUrl": "https://account.r2.cloudflarestorage.com/bucket/org/abc123-photo.jpg?X-Amz-...",
  "url": "https://media.example.com/org/abc123-photo.jpg",
  "bucketKey": "org/abc123-photo.jpg"
}
```

**What happens:**
- A DB record is created with status `"pending"`
- A presigned URL is generated with a 1-hour expiry
- The bucket key follows the format: `{organizationId}/{uploadId}-{safeName}`

### 2. Upload to R2

The frontend uploads the file directly to the presigned URL using `PUT`:

```ts
await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
});
```

### 3. Mark Upload Complete

```
POST /api/v1/orgs/:organizationId/uploads/:uploadId/complete
```

Sets the upload status to `"completed"` in the database.

### 4. List & Delete Uploads

```
GET    /api/v1/orgs/:organizationId/uploads          # List all uploads
DELETE /api/v1/orgs/:organizationId/uploads/:uploadId # Delete upload + R2 object
```

Delete operations are guarded: the R2 object **must** be deleted before the DB record is removed, preventing orphaned files.

---

## Avatar System

Profile pictures use the same upload pipeline, with an additional step to link the upload to the user record.

### Update Avatar

```
PATCH /api/v1/orgs/:organizationId/members/:userId/avatar
```

**Body:**
```json
{ "uploadId": "abc123" }
```

**What happens:**
1. Validates the user is a member of the organization
2. Finds the completed upload record
3. If user already has an avatar, deletes the old file from R2
4. Sets `user.image` to the upload's public URL

**Authorization:** Users can update their own avatar. Admins/owners can update any member's avatar.

### Remove Avatar

```
DELETE /api/v1/orgs/:organizationId/members/:userId/avatar
```

Deletes the avatar file from R2 and sets `user.image` to `null`.

### Frontend Component

The `AvatarUploader` component (`web/src/components/Upload/AvatarUploader.tsx`) uses Ant Design's `ImgCrop` for square cropping:

- **1:1 aspect ratio** enforced
- **Rotation slider** available
- **Max file size**: 5MB
- Files are uploaded in their **original format** (no forced conversion)
- After crop, the full pipeline runs automatically

The upload is triggered from the Members page three-dot dropdown menu:
- **"Update Profile Picture"** → Opens the AvatarUploader modal
- **"Remove Profile Picture"** → Confirmation dialog, then DELETE

---

## Cloudflare Image Transformations

> **Note:** Image transformations require the Cloudflare Images plan (~$5/month for 5,000 transformations). Without it, images are served directly from R2.

### How It Works

Cloudflare can transform images on-the-fly by inserting `/cdn-cgi/image/` into the URL path:

```
https://media.example.com/cdn-cgi/image/width=150,height=150,fit=cover/org123/avatar.jpg
```

### Supported Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `width`   | Target width in pixels | `width=150` |
| `height`  | Target height in pixels | `height=150` |
| `fit`     | Resize mode | `fit=cover` (crop), `fit=contain` (letterbox) |
| `quality` | Compression quality (1-100) | `quality=85` |
| `format`  | Output format | `format=webp`, `format=avif` |
| `dpr`     | Device pixel ratio | `dpr=2` |

### Caching & Cost Optimization

Transformations are **cached at the edge**. Repeated requests for the same URL + parameters do **not** count against the monthly quota. To maximize cache hits:

1. **Use standardized presets** — The `AVATAR_PRESETS` in `shared/utils/image-url.ts` define fixed sizes (xs=32px, sm=40px, md=80px, lg=200px, xl=400px)
2. **Avoid custom sizes** — Random dimensions create unique cache keys
3. **Set browser cache headers** — Long `Cache-Control` for avatar URLs

### Image URL Service

The `getImageUrl()` and `getAvatarUrl()` utilities in `shared/utils/image-url.ts` generate properly formatted transformation URLs:

```ts
import { getAvatarUrl, AVATAR_PRESETS } from "@shared/utils/image-url";

// Without transformations (current):
getAvatarUrl(user.image, "md");
// => "https://media.example.com/org123/avatar.jpg"

// With transformations enabled:
getAvatarUrl(user.image, "md", true);
// => "https://media.example.com/cdn-cgi/image/width=80,height=80,fit=cover/org123/avatar.jpg"
```

### Enabling Transformations

1. Enable **Cloudflare Images** in the Cloudflare dashboard
2. Ensure the R2 bucket is connected to a custom domain
3. Set `enableTransformations = true` when calling `getAvatarUrl()`
4. Transformations are applied at the CDN edge — no Worker code needed

---

## R2 Bucket Configuration

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret key |
| `R2_BUCKET_NAME` | Name of the R2 bucket |
| `PUBLIC_ASSET_URL` | Public URL prefix (e.g., `https://media.example.com`) |

These are set in `.dev.vars` for local development and as Cloudflare secrets for production.

### CORS Configuration

The R2 bucket needs CORS rules to allow direct browser uploads via presigned URLs:

```json
[
  {
    "AllowedOrigins": ["https://your-domain.com", "http://localhost:8000"],
    "AllowedMethods": ["GET", "PUT", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

Set this in the Cloudflare dashboard under **R2 → Bucket → Settings → CORS Policy**.

### Public Access

For serving files publicly, connect a **custom domain** to the R2 bucket:

1. Go to R2 → Bucket → Settings → Public Access
2. Add a custom domain (e.g., `media.example.com`)
3. Cloudflare automatically provisions a TLS certificate
4. Set `PUBLIC_ASSET_URL` to `https://media.example.com`

### Bucket Key Format

Files are stored with the key pattern:

```
{organizationId}/{uploadId}-{sanitizedFileName}
```

Example: `org_abc123/nano456-profile_photo.jpg`

---

## Deleting Images

### When Avatar is Updated

When a user updates their profile picture, the old avatar is deleted from R2 before the new URL is saved. This prevents orphaned files.

### When Avatar is Removed

The DELETE endpoint removes the R2 object and sets `user.image` to `null`.

### When Upload is Deleted

The uploads DELETE endpoint deletes both the R2 object and the database record. The R2 deletion is verified before the DB record is removed — if R2 deletion fails, the operation throws an error to prevent orphaned files.

---

## File Structure

```
api/
├── routes/orgs/
│   ├── avatar.routes.ts      # Avatar endpoint definitions
│   ├── avatar.handlers.ts    # Avatar handler logic
│   ├── avatar.index.ts       # Avatar router registration
│   ├── uploads.routes.ts     # Upload endpoint definitions
│   ├── uploads.handlers.ts   # Upload handler logic
│   └── uploads.index.ts      # Upload router registration
├── services/
│   ├── upload.service.ts     # Upload business logic
│   └── bucket.service.ts     # R2 / S3 operations
├── repositories/
│   ├── upload.repository.ts  # Upload DB operations
│   └── user.repository.ts    # User DB operations (findUserById, updateUser)
└── factories/
    ├── upload.factory.ts     # UploadService factory
    └── bucket.factory.ts     # BucketService factory

shared/
├── schemas/dto/
│   └── upload.dto.ts         # Shared UploadDto type
└── utils/
    └── image-url.ts          # Image URL transformation service

web/src/
├── components/Upload/
│   ├── Uploader.tsx          # General file uploader (drag & drop)
│   └── AvatarUploader.tsx    # Avatar uploader with ImgCrop
├── hooks/organization/
│   ├── useUploads.ts         # Upload list & delete hooks
│   └── useUpdateAvatar.ts   # Avatar update & remove hooks
└── pages/organization/
    └── OrganizationMembersPage.tsx  # Members table with avatar actions
```
