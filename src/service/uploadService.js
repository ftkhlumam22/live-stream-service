const imagekit = require("../tools/imagekit/imagekit");

const uploadService = async (file) => {
    try {
        const response = await imagekit.upload({
            file: Buffer.from (file.buffer),
            fileName: file.originalname,
          });
      
          const imageUrl = response.url;

          return imageUrl;
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    uploadService,
}