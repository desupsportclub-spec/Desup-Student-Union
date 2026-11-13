/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import imageCompression from 'browser-image-compression';
import { SITE_CONFIG } from '../config/site';
import { ImageAsset } from '../types';

export interface UploadOptions {
  folder?: string;
  maxDimension?: number; // max width or height in px (e.g. 1920, 1200, 600)
  maxSizeMB?: number; // target max size
  alt?: string;
}

/**
 * Reads image dimensions from a File or Data URL
 */
export async function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || 800, height: img.naturalHeight || 600 });
    };
    img.onerror = () => {
      resolve({ width: 800, height: 600 });
    };
    img.src = src;
  });
}

/**
 * Compress image using browser-image-compression in Web Worker
 */
export async function compressImageFile(file: File, options?: UploadOptions): Promise<File> {
  const maxDimension = options?.maxDimension || 1600;
  const maxSizeMB = options?.maxSizeMB || 0.4; // ~400KB

  const compressionOptions = {
    maxSizeMB,
    maxWidthOrHeight: maxDimension,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.82
  };

  try {
    const compressedBlob = await imageCompression(file, compressionOptions);
    return new File([compressedBlob], `${file.name.replace(/\.[^/.]+$/, "")}.webp`, {
      type: 'image/webp'
    });
  } catch (error) {
    console.warn("Client compression failed, using original file:", error);
    return file;
  }
}

/**
 * Convert file to Base64 Data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Main Upload Function
 * Adapts between:
 * 1. direct_base64: Stores compressed WebP directly in Firestore (zero setup, no card required)
 * 2. cloudinary: Unsigned upload to Cloudinary preset
 * 3. firebase: Firebase Storage (requires Blaze plan)
 */
export async function uploadImage(file: File, options: UploadOptions = {}): Promise<ImageAsset> {
  // Validate file size before upload (max 15MB source)
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("ไฟล์นี้ใหญ่เกินไป ลองเลือกรูปที่เล็กกว่า 15MB");
  }

  // 1. Compress client-side
  const compressedFile = await compressImageFile(file, options);

  const provider = SITE_CONFIG.imageProvider;

  // Cloudinary adapter
  if (provider === 'cloudinary' && SITE_CONFIG.cloudinary.cloudName && SITE_CONFIG.cloudinary.uploadPreset) {
    try {
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('upload_preset', SITE_CONFIG.cloudinary.uploadPreset);
      if (options.folder) {
        formData.append('folder', options.folder);
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${SITE_CONFIG.cloudinary.cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) {
        throw new Error(`Cloudinary upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        url: data.secure_url || data.url,
        width: data.width,
        height: data.height,
        alt: options.alt || file.name
      };
    } catch (err) {
      console.warn("Cloudinary upload failed, falling back to direct storage", err);
    }
  }

  // Default: Direct WebP Data URL stored in database
  const dataUrl = await fileToDataUrl(compressedFile);
  const dimensions = await getImageDimensions(dataUrl);

  return {
    url: dataUrl,
    width: dimensions.width,
    height: dimensions.height,
    alt: options.alt || file.name.replace(/\.[^/.]+$/, "")
  };
}

/**
 * Helper to build ImageAsset from external link
 */
export async function createAssetFromUrl(url: string, alt: string): Promise<ImageAsset> {
  const dimensions = await getImageDimensions(url);
  return {
    url,
    width: dimensions.width,
    height: dimensions.height,
    alt: alt || "รูปภาพ"
  };
}
