import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || 'linkdrop-dev-secret-key-change-in-prod';

if (nodeEnv === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'linkdrop-dev-secret-key-change-in-prod')) {
  throw new Error('JWT_SECRET environment variable is missing or insecure in production');
}

export const env = {
  port: Number(process.env.PORT || 8080),
  jwtSecret,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/linkdrop',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  s3Endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  s3Bucket: process.env.S3_BUCKET || 'linkdrop',
  s3AccessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
  s3SecretKey: process.env.S3_SECRET_KEY || 'minioadmin',
  s3Region: process.env.S3_REGION || 'us-east-1',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  clamavHost: process.env.CLAMAV_HOST || 'localhost',
  clamavPort: Number(process.env.CLAMAV_PORT || 3310),
  turnServer: process.env.TURN_SERVER || 'turn:localhost:3478',
  turnUser: process.env.TURN_USER || 'linkdrop',
  turnPassword: process.env.TURN_PASSWORD || 'linkdrop',
  stunServer: process.env.STUN_SERVER || 'stun:stun.l.google.com:19302',
  nodeEnv,
};
