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
  s3Endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  s3Bucket: process.env.S3_BUCKET || 'linkdrop',
  s3AccessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
  s3SecretKey: process.env.S3_SECRET_KEY || 'minioadmin',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  nodeEnv,
};
