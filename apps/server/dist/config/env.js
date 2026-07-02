import 'dotenv/config';
export const env = {
    port: Number(process.env.PORT || 8080),
    mongoUri: process.env.MONGODB_URI || '',
    redisUrl: process.env.REDIS_URL || '',
    jwtSecret: process.env.JWT_SECRET || 'linkdrop-dev-secret-key-change-in-prod',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    s3Endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    s3Bucket: process.env.S3_BUCKET || 'linkdrop',
    s3AccessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    s3SecretKey: process.env.S3_SECRET_KEY || 'minioadmin',
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    nodeEnv: process.env.NODE_ENV || 'development',
};
