const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Cloudinary signature response
export interface UploadSignature {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

// Cloudinary upload response
export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  original_filename: string;
  format: string;
  resource_type: string;
}

type UploadType = "resume" | "profile-picture";

// ============================================
// 1. Generate signature from backend
// ============================================

export async function generateCloudinarySignature(
  uploadType: UploadType,
): Promise<UploadSignature> {
  const accessToken = sessionStorage.getItem("access_token");

  if (!accessToken) {
    throw new Error("Authentication required. Please login.");
  }

  const signatureResponse = await fetch(
    `${API_URL}/candidate-profile/${uploadType}/upload-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!signatureResponse.ok) {
    const errorData = await signatureResponse.json().catch(() => null);

    throw new Error(
      errorData?.message || "Failed to generate upload signature",
    );
  }

  const signatureData: UploadSignature =
    await signatureResponse.json();

  return signatureData;
}

// ============================================
// 2. Upload using an existing signature
// ============================================

export async function uploadFileWithSignature(
  file: File,
  signatureData: UploadSignature,
): Promise<CloudinaryUploadResponse> {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", signatureData.apiKey);
  formData.append("timestamp", String(signatureData.timestamp));
  formData.append("signature", signatureData.signature);
  formData.append("folder", signatureData.folder);

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/auto/upload`;

  const uploadResponse = await fetch(cloudinaryUrl, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse.json().catch(() => null);

    throw new Error(
      errorData?.error?.message || "Cloudinary upload failed",
    );
  }

  return await uploadResponse.json();
}

// ============================================
// 3. Existing upload function
//    (Keep this for profile picture uploads)
// ============================================

export async function uploadFileToCloudinary(
  file: File,
  uploadType: UploadType,
): Promise<CloudinaryUploadResponse> {
  // Generate signature
  const signatureData =
    await generateCloudinarySignature(uploadType);

  // Upload using signature
  return uploadFileWithSignature(file, signatureData);
}