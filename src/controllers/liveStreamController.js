const { CONFIG } = require("../config/config");
const { minioClient } = require("../tools/minio/minio");
const httpResponse = require("../helper/httpResponse");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const cron = require("node-cron");

let streamingProcess = null;
let scheduledJob = null;

const getDataVideo = async (req, res) => {
  const videoList = [];
  try {
    const objects = await minioClient.listObjects(
      CONFIG.MINIO.BUCKET_NAME,
      "",
      true
    );
    for await (const obj of objects) {
      if (obj.name.endsWith(".mp4")) {
        videoList.push(obj.name);
      }
    }
    return httpResponse.successResponse(res, videoList);
  } catch (error) {
    return httpResponse.badRequestResponse(res, "Video not found");
  }
};

const uploadVideoData = async (req, res) => {
  const { originalname, buffer } = req.file;

  // Ganti spasi dengan underscore pada nama file
  const sanitizedFileName = originalname.replace(/\s+/g, "_");

  minioClient.putObject(
    CONFIG.MINIO.BUCKET_NAME,
    sanitizedFileName,
    buffer,
    (err, etag) => {
      if (err) {
        return httpResponse.badRequestResponse(res, "Failed to upload video");
      }
      return httpResponse.successResponse(res, "Video uploaded successfully");
    }
  );
};

const startStreamYoutube = async (req, res) => {
  const { objectName, streamKey } = req.body;
  const localVideoPath = path.join(__dirname, "../downloads", objectName);

  console.log(localVideoPath);
  try {
    await new Promise((resolve, reject) => {
      minioClient.fGetObject(
        CONFIG.MINIO.BUCKET_NAME,
        objectName,
        localVideoPath,
        (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        }
      );
    });

    console.log(`Video downloaded to ${localVideoPath}`);

    const command = `ffmpeg -re -i ${localVideoPath} -c:v copy -c:a aac -f flv rtmp://a.rtmp.youtube.com/live2/${streamKey}`;
    streamingProcess = exec(command);

    streamingProcess.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    streamingProcess.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    streamingProcess.on("close", (code) => {
      console.log(`Streaming process exited with code ${code}`);
      // Hapus file lokal setelah streaming selesai
      fs.unlink(localVideoPath, (err) => {
        if (err) console.error("Error deleting file", err);
      });
    });

    return httpResponse.successResponse(res, "Streaming started");
  } catch (error) {
    console.error("Error downloading video or starting stream:", error);
    return httpResponse.badRequestResponse(res, "Error starting stream");
  }
};

const stopStreamYoutube = async (req, res) => {
  const { objectName } = req.body; // Pastikan untuk mendapatkan objectName yang tepat
  if (streamingProcess) {
    console.log("Stopping stream:", streamingProcess.pid);
    streamingProcess.kill("SIGINT"); // atau "SIGTERM"

    // Menghapus file lokal setelah menghentikan proses (hati-hati jika diingat, jika file dibutuhkan)
    const localVideoPath = path.join(__dirname, "../downloads", objectName); // Pastikan untuk mendapatkan objectName yang tepat
    fs.unlink(localVideoPath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log("File deleted successfully:", localVideoPath);
      }
    });

    streamingProcess = null; // Reset variabel
    return httpResponse.successResponse(res, "Streaming stopped");
  } else {
    console.log("Attempted to stop stream, but no stream is running.");
    return httpResponse.badRequestResponse(res, "No stream running");
  }
};

const scheduleStreamYoutube = async (req, res) => {
  const { objectName, streamKey, scheduleTime } = req.body; // Format scheduleTime: 'YYYY-MM-DD HH:mm'

  // Konversi string ke objek Date
  const scheduleDate = new Date(scheduleTime);

  // Validasi
  if (isNaN(scheduleDate.getTime())) {
    return httpResponse.badRequestResponse(res, "Invalid date format");
  }

  // Hitung selisih waktu sampai jadwal
  const now = new Date();
  const delay = scheduleDate - now;

  if (delay < 0) {
    return httpResponse.badRequestResponse(
      res,
      "Schedule time must be in the future"
    );
  }

  // Jika ada job yang sudah terjadwal, hentikan
  if (scheduledJob) {
    clearTimeout(scheduledJob);
  }

  // Jadwalkan streaming
  scheduledJob = setTimeout(async () => {
    try {
      await startStreamYoutubeFunc(objectName, streamKey); // Fungsi untuk memulai streaming
    } catch (error) {
      return httpResponse.serverErrorResponse(res, "Error starting stream");
    }
  }, delay);

  return httpResponse.successResponse(
    res,
    `Streaming scheduled at ${scheduleTime}`
  );
};

const startStreamYoutubeFunc = async (objectName, streamKey) => {
  const localVideoPath = path.join(__dirname, "../downloads", objectName);

  // Mengunduh video dari MinIO
  await new Promise((resolve, reject) => {
    minioClient.fGetObject(
      CONFIG.MINIO.BUCKET_NAME,
      objectName,
      localVideoPath,
      (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      }
    );
  });

  console.log(`Video downloaded to ${localVideoPath}`);

  const command = `ffmpeg -re -i ${localVideoPath} -c:v copy -c:a aac -f flv rtmp://a.rtmp.youtube.com/live2/${streamKey}`;
  streamingProcess = exec(command);

  streamingProcess.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  streamingProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  streamingProcess.on("close", (code) => {
    console.log(`Streaming process exited with code ${code}`);
    fs.unlink(localVideoPath, (err) => {
      if (err) console.error("Error deleting file", err);
    });
  });
};

module.exports = {
  getDataVideo,
  uploadVideoData,
  startStreamYoutube,
  stopStreamYoutube,
  scheduleStreamYoutube,
};
