const cloudinary = require('cloudinary').v2;

const ENV_ROOT = 'localmiles_dev';

// 1. Configure Cloudinary with your .env keys
cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
});

// 2. Delete Helper
const deleteFromCloudinary = async (filename) => {
  try {
    if (!filename) return;
    const fullPath = filename.includes('/') ? filename : `${ENV_ROOT}/orders/packages/${filename}`.trim();
    await cloudinary.uploader.destroy(fullPath);
    console.log("✅ Deleted from Cloudinary:", fullPath);
  } catch (error) {
    console.error("❌ Cloudinary Delete Error:", error);
  }
};

// 3. Export the CONFIGURED instance
module.exports = { cloudinary, deleteFromCloudinary };