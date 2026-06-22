// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import { fileURLToPath } from "url";
// import ApiError from "../utils/ApiError.js";

// // ─────────────────────────────────────────────
// //  DIRECTORY SETUP
// //  Resolve the absolute path to /uploads from
// //  the project root (works with ES Modules)
// // ─────────────────────────────────────────────
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Goes up from src/middleware → src → project root, then into uploads/
// const UPLOADS_DIR = path.join(__dirname, "../../uploads");

// // Create uploads/ folder if it doesn't exist yet
// if (!fs.existsSync(UPLOADS_DIR)) {
//   fs.mkdirSync(UPLOADS_DIR, { recursive: true });
// }

// // ─────────────────────────────────────────────
// //  MULTER — DISK STORAGE
// //  Saves files directly to /uploads on disk.
// //  Filename: fieldname-timestamp-random.ext
// //  e.g. images-1718234400000-492039182.jpg
// // ─────────────────────────────────────────────
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, UPLOADS_DIR);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//     const ext = path.extname(file.originalname).toLowerCase();
//     cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|webp/;
//   const isValidExt = allowedTypes.test(
//     path.extname(file.originalname).toLowerCase()
//   );
//   const isValidMime = allowedTypes.test(file.mimetype);

//   if (isValidExt && isValidMime) {
//     cb(null, true);
//   } else {
//     cb(new ApiError(400, "Only .jpg, .jpeg, .png and .webp images are allowed"));
//   }
// };

// export const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
// });

// // ─────────────────────────────────────────────
// //  HELPER — build the public URL for a saved file
// //  Returns: /uploads/images-1718234400000-123.jpg
// //  Frontend accesses it as:
// //  http://localhost:8000/uploads/images-1718234400000-123.jpg
// // ─────────────────────────────────────────────
// export const getImageUrl = (filename) => `/uploads/${filename}`;

// // ─────────────────────────────────────────────
// //  HELPER — delete a local image file by its URL path
// //  e.g. deleteLocalImage("/uploads/images-123.jpg")
// //  Silently ignores missing files so a bad path
// //  doesn't crash a delete/update route.
// // ─────────────────────────────────────────────
// export const deleteLocalImage = (imageUrl) => {
//   try {
//     if (!imageUrl) return;
//     // Strip the leading /uploads/ to get just the filename
//     const filename = path.basename(imageUrl);
//     const filePath = path.join(UPLOADS_DIR, filename);
//     if (fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//     }
//   } catch (_) {
//     // Non-fatal — log in dev but don't crash
//     if (process.env.NODE_ENV === "development") {
//       console.warn(`⚠️  Could not delete image: ${imageUrl}`);
//     }
//   }
// };

// // ─────────────────────────────────────────────
// //  CLOUDINARY ALTERNATIVE (commented out)
// //  To switch back to Cloudinary:
// //  1. npm install cloudinary
// //  2. Fill CLOUDINARY_* vars in .env
// //  3. Uncomment below and replace upload/getImageUrl/deleteLocalImage exports
// // ─────────────────────────────────────────────

// // import { v2 as cloudinary } from "cloudinary";
// // import { Readable } from "stream";
// //
// // cloudinary.config({
// //   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
// //   api_key:    process.env.CLOUDINARY_API_KEY,
// //   api_secret: process.env.CLOUDINARY_API_SECRET,
// // });
// //
// // export const upload = multer({ storage: multer.memoryStorage(), fileFilter });
// //
// // export const uploadToCloudinary = (buffer, folder) =>
// //   new Promise((resolve, reject) => {
// //     const stream = cloudinary.uploader.upload_stream(
// //       { folder, resource_type: "image" },
// //       (err, result) => err ? reject(new ApiError(500, "Cloudinary upload failed")) : resolve({ url: result.secure_url, public_id: result.public_id })
// //     );
// //     Readable.from(buffer).pipe(stream);
// //   });
// //
// // export const deleteFromCloudinary = async (public_id) => {
// //   try { if (public_id) await cloudinary.uploader.destroy(public_id); } catch (_) {}
// // };
