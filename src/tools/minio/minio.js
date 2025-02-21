const Minio = require("minio");
const { CONFIG } = require("../../config/config");

const minioClient = new Minio.Client({
  endPoint: CONFIG.MINIO.ENDPOINT,
  port: CONFIG.MINIO.PORT,
  useSSL: false,
  accessKey: CONFIG.MINIO.ACCESS_KEY,
  secretKey: CONFIG.MINIO.SECRET_KEY,
});

module.exports = {
    minioClient,
}