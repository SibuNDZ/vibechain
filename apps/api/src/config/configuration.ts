export interface DatabaseConfig {
  url: string;
  poolMin: number;
  poolMax: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
}

export interface ThrottleConfig {
  ttl: number;
  limit: number;
}

export interface BlockchainConfig {
  polygonRpcUrl: string;
  polygonAmoyRpcUrl: string;
}

export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
  throttle: ThrottleConfig;
  blockchain: BlockchainConfig;
}

export default (): Config => ({
  app: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  database: {
    url: process.env.DATABASE_URL || '',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },

  blockchain: {
    polygonRpcUrl:
      process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    polygonAmoyRpcUrl:
      process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
  },
});
