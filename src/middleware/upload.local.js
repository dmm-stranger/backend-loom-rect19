import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import ApiError from "../utils/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, "../../uploads");


let uploadsDirReady = false;
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  uploadsDirReady = true;
} catch (err) {
  console.error(
    `⚠️  Could not create uploads directory at ${UPLOADS_DIR}. ` +
    `This usually means you're on a read-only filesystem (e.g. Vercel). ` +
    `Set IMAGE_STORAGE=cloudinary in your environment variables. ` +
    `Original error: ${err.message}`
  );
}

// ─── Multer disk storage ───────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!uploadsDirReady) {
      return cb(
        new ApiError(
          500,
          "Local image storage is unavailable on this server. " +
          "Set IMAGE_STORAGE=cloudinary in your environment variables."
        )
      );
    }
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // ...   // leave this part unchanged
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const validExt = allowed.test(path.extname(file.originalname).toLowerCase());
  const validMime = allowed.test(file.mimetype);
  if (validExt && validMime) return cb(null, true);
  cb(new ApiError(400, "Only .jpg, .jpeg, .png and .webp images are allowed"));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Returns public URL path stored in MongoDB
export const getImageUrl = (filename) => `/uploads/${filename}`;

// Deletes image file from disk
export const deleteImage = (imageUrl) => {
  try {
    if (!imageUrl || !uploadsDirReady) return;
    const filename = path.basename(imageUrl);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`⚠️  Could not delete local image: ${imageUrl}`);
    }
  }
};

// uploadImage is not needed for local — multer saves directly to disk
// Exported as null so upload.middleware.js can detect the storage type
export const uploadImage = null;
