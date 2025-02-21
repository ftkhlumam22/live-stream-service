require("dotenv").config();

const {
  PORT,
  DB_USER,
  DB_NAME,
  DB_PASSWORD,
  DB_HOST,
  SECRET_KEY,
  URL_MINIO,
  PORT_MINIO,
  SSL_MINIO,
  ACCESS_KEY_MINIO,
  SECRET_KEY_MINIO,
  ACCESS_URL_MINIO,
  BUCKET_MINIO,
} = process.env;

const CONFIG = {
  PORT: PORT || 3000,
  DATABASE: {
    USERNAME: DB_USER || "root",
    PASSWORD: DB_PASSWORD || "",
    HOST: DB_HOST || "127.0.0.1",
    NAME: DB_NAME || "database",
  },
  JWT: {
    SECRET: SECRET_KEY,
  },
  MINIO: {
    ENDPOINT: URL_MINIO,
    PORT: PORT_MINIO,
    SSL: Boolean(SSL_MINIO) || false,
    ACCESS_KEY: ACCESS_KEY_MINIO,
    SECRET_KEY: SECRET_KEY_MINIO,
    URL: ACCESS_URL_MINIO,
    BUCKET_NAME: BUCKET_MINIO,
  },
};

module.exports = {
  CONFIG,
};
