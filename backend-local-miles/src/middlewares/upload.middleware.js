const multer = require('multer');
const path = require('path');

// 🔥 IMPORT THE CONFIGURED INSTANCE (This gives us the API Keys!)
const { cloudinary } = require('../config/cloudinary');

const ENV_ROOT = 'localmiles_dev';

// 1. Memory Storage (Grabs file directly into RAM)
const storage = multer.memoryStorage();
const multerUpload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// 2. Custom Cloudinary Uploader Middleware
const uploadMiddleware = {
  array: (fieldName, maxCount) => {
    return (req, res, next) => {
      
      const multerExec = multerUpload.array(fieldName, maxCount);
      
      multerExec(req, res, async (err) => {
        if (err) return res.status(400).json({ success: false, message: "File upload error", error: err.message });
        if (!req.files || req.files.length === 0) return next();

        try {
          const uploadPromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
              
              let originalName = file.originalname ? path.parse(file.originalname).name : 'upload';
              let cleanName = originalName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
              const finalId = `pkg_${Date.now()}_${cleanName}`;

              console.log(`🚀 Uploading to Cloudinary: [${finalId}]`);

              // Cloudinary is now configured, so this will succeed
              const uploadStream = cloudinary.uploader.upload_stream(
                {
                  folder: `${ENV_ROOT}/orders/packages`,
                  public_id: finalId,
                  resource_type: 'auto'
                },
                (error, result) => {
                  if (error) {
                    console.error("❌ Cloudinary Stream Error:", error);
                    return reject(error);
                  }
                  
                  // Attach the URLs so Prisma can save them to the database
                  file.filename = result.public_id; 
                  file.path = result.secure_url;
                  
                  console.log(`✅ Upload Success: ${result.public_id}`);
                  resolve(result);
                }
              );

              // Instantly stream the buffer
              uploadStream.end(file.buffer);
            });
          });

          // Wait for all images to upload
          await Promise.all(uploadPromises);
          
          // Move to the Prisma Controller
          next();
          
        } catch (error) {
          console.error("❌ Final Upload Error:", error);
          return res.status(500).json({ success: false, message: "Image upload to Cloudinary failed." });
        }
      });
    };
  }
};

module.exports = uploadMiddleware;