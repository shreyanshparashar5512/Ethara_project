import 'dotenv/config';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/team_task_manager'),
  jwtSecret: required('JWT_SECRET', 'dev_secret_change_me_please_minimum_32_chars_long'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
};
