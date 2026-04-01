import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadParecer(
  buffer: Buffer,
  filename: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "rst-transparente/pareceres",
        resource_type: "raw",
        format: "pdf",
        public_id: `${Date.now()}-${filename.replace(/[^a-zA-Z0-9]/g, "-")}`,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload falhou"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}

export async function deleteParecer(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}

export default cloudinary;
