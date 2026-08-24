// ─────────────────────────────────────────────
//  IMAGE UPLOADS — Cloudinary only
//
//  Every image upload in the app (products, categories,
//  user avatars) goes through Cloudinary's CDN. Files are
//  held in memory by multer and streamed straight to
//  Cloudinary — nothing ever touches local disk.
//
//  Requires these vars in your .env file (note the dot):
//    CLOUDINARY_CLOUD_NAME=xxxx
//    CLOUDINARY_API_KEY=xxxx
//    CLOUDINARY_API_SECRET=xxxx
// ─────────────────────────────────────────────

import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn(
    "⚠️  Cloudinary env vars are missing (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET). " +
    "Image uploads will fail until these are set in your .env file."
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Multer: buffer files in memory (never written to disk) ───
const memoryStorage = multer.memoryStorage();

export const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// ─── Stream a buffer to Cloudinary, resolve { url, public_id } ───
export const uploadImage = (buffer, folder = "techstore") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

// ─── Delete an image from Cloudinary by its public_id ───
export const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete failed:", err.message);
  }
};