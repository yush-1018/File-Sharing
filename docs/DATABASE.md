# LinkDrop Database Schema & Indexes

## 1. User Model (`User`)
```typescript
interface IUser {
  _id: ObjectId;
  email?: string; // Sparse index
  name: string;
  passwordHash?: string;
  guest: boolean; // Default false
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date; // Index for 30-day guest cleanup
}
```

---

## 2. File & Transfer Model (`Transfer`)
```typescript
interface ITransfer {
  _id: ObjectId;
  senderUserId: ObjectId; // Index
  receiverUserId?: ObjectId; // Index
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath?: string;
  s3Key?: string;
  transferMethod: 'local' | 'webrtc' | 'bluetooth' | 'cloud';
  status: 'pending' | 'uploading' | 'in_progress' | 'completed' | 'paused' | 'cancelled' | 'failed';
  progress: number;
  transferredBytes: number;
  speed: string;
  peer?: string;
  resumeToken?: string;
  encrypted: boolean;
  totalChunks?: number;
  chunkSize?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Cloud Link Model (`CloudLink`)
```typescript
interface ICloudLink {
  _id: ObjectId;
  userId: ObjectId; // Index
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath?: string;
  s3Key?: string;
  url: string;
  passwordHash?: string; // Salted PBKDF2
  passwordSalt?: string;
  iv?: string;
  authTag?: string;
  downloads: number;
  views: number;
  active: boolean; // Index
  reported?: boolean; // Takedown flag
  reportReason?: string;
  expiresAt: Date; // Index for TTL cleanup
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 4. Folder Model (`Folder`)
```typescript
interface IFolder {
  _id: ObjectId;
  userId: ObjectId; // Index
  name: string;
  parentId?: ObjectId; // Index for nested folder hierarchy
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 5. Activity Log Model (`Activity`)
```typescript
interface IActivity {
  _id: ObjectId;
  userId: ObjectId; // Index
  action: 'upload' | 'download' | 'share' | 'delete' | 'login';
  details: string;
  ipAddress?: string;
  createdAt: Date;
}
```
