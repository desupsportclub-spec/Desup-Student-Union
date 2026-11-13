/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { DownloadItem } from '../types';

// Keep each Firestore chunk comfortably below the 1 MiB document size limit
const CHUNK_CHAR_SIZE = 550000;

/**
 * Splits a Data URL into chunks and stores them under /downloads/{docId}/chunks/{index}
 */
export async function saveDownloadWithChunks(
  docId: string,
  meta: Omit<DownloadItem, 'id'>,
  onProgress?: (percent: number) => void
): Promise<void> {
  const rawUrl = meta.fileUrl.trim();
  const isLargeDataUrl = rawUrl.startsWith('data:') && rawUrl.length > CHUNK_CHAR_SIZE;

  // Clean up any existing chunks first when overwriting
  try {
    const oldChunksSnap = await getDocs(collection(db, 'downloads', docId, 'chunks'));
    if (!oldChunksSnap.empty) {
      const delBatch = writeBatch(db);
      oldChunksSnap.forEach((d) => delBatch.delete(d.ref));
      await delBatch.commit();
    }
  } catch (err) {
    console.warn('Could not clean previous chunks:', err);
  }

  if (!isLargeDataUrl) {
    await setDoc(doc(db, 'downloads', docId), {
      ...meta,
      fileUrl: rawUrl,
      isChunked: false,
      chunkCount: 0,
    });
    onProgress?.(100);
    return;
  }

  const totalChunks = Math.ceil(rawUrl.length / CHUNK_CHAR_SIZE);

  // Save parent document without huge inline base64 payload
  await setDoc(doc(db, 'downloads', docId), {
    ...meta,
    fileUrl: '',
    isChunked: true,
    chunkCount: totalChunks,
  });

  onProgress?.(10);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_CHAR_SIZE;
    const chunkData = rawUrl.slice(start, start + CHUNK_CHAR_SIZE);
    await setDoc(doc(db, 'downloads', docId, 'chunks', String(i).padStart(4, '0')), {
      index: i,
      data: chunkData,
    });
    const pct = Math.round(10 + ((i + 1) / totalChunks) * 90);
    onProgress?.(pct);
  }
}

/**
 * Deletes a download document along with any stored file chunks
 */
export async function deleteDownloadWithChunks(docId: string): Promise<void> {
  try {
    const chunksSnap = await getDocs(collection(db, 'downloads', docId, 'chunks'));
    if (!chunksSnap.empty) {
      const batch = writeBatch(db);
      chunksSnap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    console.warn('Could not delete download chunks:', err);
  }
  await deleteDoc(doc(db, 'downloads', docId));
}

/**
 * Converts a base64 Data URL to a browser Blob Object URL to avoid 2MB Chrome data:-URI limits
 */
export function dataUrlToBlobUrl(dataUrl: string): string {
  if (!dataUrl.startsWith('data:')) return dataUrl;
  try {
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return dataUrl;
    const header = dataUrl.slice(5, commaIdx);
    const mimeType = header.split(';')[0] || 'application/pdf';
    const base64 = dataUrl.slice(commaIdx + 1);
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('Could not convert dataUrl to Blob URL:', err);
    return dataUrl;
  }
}

/**
 * Reassembles a DownloadItem's file (single doc or chunked) into an openable URL (Blob URL for data URLs, or original external URL)
 */
export async function resolveDownloadUrl(item: DownloadItem): Promise<{ url: string; isBlob: boolean }> {
  if (item.isChunked && item.id) {
    const chunksSnap = await getDocs(collection(db, 'downloads', item.id, 'chunks'));
    const parts: { index: number; data: string }[] = [];
    chunksSnap.forEach((d) => {
      const data = d.data() as { index: number; data: string };
      parts.push(data);
    });
    parts.sort((a, b) => a.index - b.index);
    const assembledDataUrl = parts.map((p) => p.data).join('');
    if (!assembledDataUrl) {
      throw new Error('ไม่พบข้อมูลชิ้นส่วนไฟล์เอกสารในฐานข้อมูล');
    }
    const blobUrl = dataUrlToBlobUrl(assembledDataUrl);
    return { url: blobUrl, isBlob: blobUrl.startsWith('blob:') };
  }

  if (item.fileUrl?.startsWith('data:')) {
    const blobUrl = dataUrlToBlobUrl(item.fileUrl);
    return { url: blobUrl, isBlob: blobUrl.startsWith('blob:') };
  }

  return { url: item.fileUrl, isBlob: false };
}
