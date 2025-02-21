const express = require("express");
const router = express.Router();

const upload = require("../../middleware/upload");

const liveStreamController = require("../../controllers/liveStreamController");

router.get("/videos", liveStreamController.getDataVideo);
router.post("/video", upload.single("video"), liveStreamController.uploadVideoData);
router.post("/stream-youtube", liveStreamController.startStreamYoutube);
router.post("/stop-stream", liveStreamController.stopStreamYoutube);
router.post("/schedule-stream-youtube", liveStreamController.scheduleStreamYoutube);

module.exports = router;
