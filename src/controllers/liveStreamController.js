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

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true }); // Buat direktori beserta sub-direktorinya jika perlu
  }
};

const uploadVideoData = async (req, res) => {
  const { chunkIndex, totalChunks, filename } = req.body;
  const { buffer } = req.file;
  const sanitizedFileName = filename.replace(/\s+/g, "_");
  const uploadsDir = path.join("uploads"); // Path untuk direktori uploads
  const chunkFilePath = path.join(
    uploadsDir,
    `${sanitizedFileName}.part${chunkIndex}`
  );

  // Pastikan direktori uploads ada
  ensureDirectoryExists(uploadsDir);

  // Simpan chunk ke sistem file lokal
  fs.writeFile(chunkFilePath, buffer, async (err) => {
    if (err) {
      console.error("Error saving chunk:", err);
      return res.status(400).json({ message: "Failed to Upload Video Chunk" });
    }

    // Jika semua chunk sudah di-upload
    if (parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
      const finalFilePath = path.join(uploadsDir, sanitizedFileName); // File akhir untuk digabungkan
      // Menggabungkan file chunks ke file akhir
      const writeStream = fs.createWriteStream(finalFilePath);
      const mergeChunks = async () => {
        for (let i = 0; i < totalChunks; i++) {
          const chunkFileName = `${sanitizedFileName}.part${i}`;
          const chunkPath = path.join(uploadsDir, chunkFileName); // Pastikan path benar
          // Membaca dan menulis chunk ke file akhir
          await new Promise((resolve, reject) => {
            const readStream = fs.createReadStream(chunkPath);
            readStream.pipe(writeStream, { end: false });
            readStream.on("end", () => {
              console.log(
                `Chunk ${chunkFileName} has been piped to final file.`
              );
              resolve(); // Resolving the promise when done
            });
            readStream.on("error", (error) => {
              reject(error);
            });
          });
        }
        writeStream.end(); // Menutup stream setelah semua chunk selesai di-pipe
      };

      mergeChunks()
        .then(() => {
          // Setelah gabungan selesai, upload file ke MinIO
          minioClient.putObject(
            CONFIG.MINIO.BUCKET_NAME,
            sanitizedFileName,
            fs.createReadStream(finalFilePath),
            {
              "Content-Type": "video/mp4", // Tentukan Content-Type yang sesuai
            },
            (err) => {
              // Hapus chunks lokal setelah upload
              for (let i = 0; i < totalChunks; i++) {
                const chunkFileName = `${sanitizedFileName}.part${i}`;
                const chunkPath = path.join(uploadsDir, chunkFileName);
                fs.unlink(chunkPath, (unlinkErr) => {
                  if (unlinkErr) {
                    console.error(
                      `Error deleting chunk ${chunkFileName}:`,
                      unlinkErr
                    );
                  } else {
                    console.log(`Chunk ${chunkFileName} deleted successfully.`);
                  }
                });
              }
              const fileLocalName = path.join(uploadsDir, sanitizedFileName);

              fs.unlink(fileLocalName, (unlinkErr) => {
                if (unlinkErr) {
                  console.error(
                    `Error deleting file ${fileLocalName}:`,
                    unlinkErr
                  );
                } else {
                  console.log(`File ${fileLocalName} deleted successfully.`);
                }
              });
              if (err) {
                return res
                  .status(500)
                  .json({ message: "Failed to upload final merged file" });
              }
              console.log("File successfully uploaded to MinIO!");
              return res.status(200).json({
                message: "All chunks uploaded and merged successfully!",
              });
            }
          );
        })
        .catch((error) => {
          console.error("Error merging chunks:", error);
          return res.status(500).json({ message: "Failed to merge chunks." });
        });
    } else {
      return res.status(200).json({ message: "Chunk uploaded successfully" });
    }
  });
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
