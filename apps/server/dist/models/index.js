import { Schema, model } from 'mongoose';
export const User = model('User', new Schema({
    email: { type: String, index: true },
    phone: String,
    name: { type: String, required: true },
    avatarUrl: String,
    authProviders: [{ provider: String, providerId: String }],
    passwordHash: String,
    guest: { type: Boolean, default: false },
    friendIds: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true }));
export const Device = model('Device', new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: String,
    platform: String,
    deviceType: String,
    batteryPct: Number,
    lastSeenAt: Date,
    capabilities: [String],
    networkHints: {
        localIp: String,
        mdnsName: String,
        bluetoothId: String,
        wifiSsid: String
    }
}, { timestamps: true }));
export const Transfer = model('Transfer', new Schema({
    senderUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    receiverUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    transferMethod: String,
    status: { type: String, index: true },
    encrypted: { type: Boolean, default: true },
    totalBytes: Number,
    transferredBytes: { type: Number, default: 0 },
    fileManifest: [{
            path: String,
            size: Number,
            mimeType: String,
            checksum: String,
            chunkSize: Number
        }],
    resumeToken: String,
    passwordProtected: Boolean,
    expiresAt: Date,
    metadata: Schema.Types.Mixed
}, { timestamps: true }));
export const ChatMessage = model('ChatMessage', new Schema({
    roomId: { type: String, index: true },
    senderUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['text', 'emoji', 'gif', 'voice', 'image', 'video', 'document', 'system'] },
    text: String,
    attachment: Schema.Types.Mixed,
    deliveredTo: [String],
    readBy: [String]
}, { timestamps: true }));
export const Group = model('Group', new Schema({
    name: String,
    avatarUrl: String,
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    memberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true }));
