const CLOUDINARY_CLOUD_NAME = "dwvmsjgvd";
const CLOUDINARY_UPLOAD_PRESET = "ecommerce_products";

export async function uploadAdminImage(file, folder = "ecommerce/admin") {
  if (!file) {
    throw new Error("Choose an image before uploading.");
  }

  if (!file.type?.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image must be smaller than 10MB.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || "Image upload failed.");
  }

  return data.secure_url;
}
