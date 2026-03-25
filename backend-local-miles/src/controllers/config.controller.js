exports.getMapConfig = (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_KEY;

    // Logic: If key exists and isn't empty, use Google. Otherwise, fallback to Leaflet.
    if (apiKey && apiKey.trim() !== "") {
      return res.status(200).json({ 
        provider: 'google', 
        apiKey: apiKey 
      });
    }

    // Default fallback
    res.status(200).json({ 
      provider: 'leaflet',
      message: 'No API Key found in backend .env'
    });

  } catch (error) {
    console.error("Config Error:", error);
    res.status(500).json({ provider: 'leaflet' });
  }
};

exports.getCloudinaryConfig = (req, res) => {
  res.json({
    success: true,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME // Only send the public name!
  });
};