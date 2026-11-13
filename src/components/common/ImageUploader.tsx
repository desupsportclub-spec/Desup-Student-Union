/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { uploadImage, createAssetFromUrl } from '../../lib/imageService';
import { ImageAsset } from '../../types';

interface ImageUploaderProps {
  value?: ImageAsset | string;
  onChange: (asset: ImageAsset) => void;
  aspectRatioLabel?: string; // e.g. "3:2 (ปกข่าว)", "4:5 (บุคลากร)", "1:1"
  folder?: string;
  maxDimension?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  aspectRatioLabel = "สัดส่วนแนะนำ 3:2 หรือ 4:5",
  folder = "uploads",
  maxDimension = 1600
}) => {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [altText, setAltText] = useState(typeof value === 'object' ? value.alt : '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUrl = typeof value === 'object' ? value?.url : (typeof value === 'string' ? value : '');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsUploading(true);
    setUploadProgress(20);

    try {
      setUploadProgress(50);
      const asset = await uploadImage(file, {
        folder,
        maxDimension,
        alt: altText || file.name.replace(/\.[^/.]+$/, "")
      });
      setUploadProgress(100);
      onChange(asset);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการประมวลผลรูปภาพ";
      setErrorMsg(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setErrorMsg(null);
    setIsUploading(true);
    try {
      const asset = await createAssetFromUrl(urlInput.trim(), altText || "รูปภาพ");
      onChange(asset);
      setUrlInput('');
    } catch (err) {
      setErrorMsg("ไม่สามารถโหลดรูปภาพจากลิงก์ที่ระบุได้ กรุณาตรวจสอบ URL");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange({ url: '', alt: '' });
  };

  return (
    <div className="border border-[#4B1F7A]/15 bg-[#FAF7F0] p-4 rounded-sm space-y-3">
      <div className="flex items-center justify-between border-b border-[#4B1F7A]/10 pb-2">
        <div className="flex items-center gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`pb-1 transition-colors ${tab === 'upload' ? 'border-b-2 border-[#B8923A] text-[#2A1245] font-semibold' : 'text-[#1B1226]/60 hover:text-[#2A1245]'}`}
          >
            อัปโหลดไฟล์จากเครื่อง / ถ่ายภาพ
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`pb-1 transition-colors ${tab === 'url' ? 'border-b-2 border-[#B8923A] text-[#2A1245] font-semibold' : 'text-[#1B1226]/60 hover:text-[#2A1245]'}`}
          >
            ระบุลิงก์รูปภาพ (URL)
          </button>
        </div>
        <span className="text-[11px] text-[#9C7A2B]">{aspectRatioLabel}</span>
      </div>

      {/* Preview if exists */}
      {currentUrl ? (
        <div className="relative group border border-[#B8923A]/30 overflow-hidden bg-stone-100 max-h-64 flex items-center justify-center">
          <img
            src={currentUrl}
            alt={altText || "พรีวิวรูปภาพ"}
            className="max-h-64 w-auto object-contain"
          />
          <div className="absolute inset-0 bg-[#2A1245]/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 text-white text-xs">
            <p className="line-clamp-1 text-center font-medium">{altText || "ไม่มีคำอธิบาย alt"}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 bg-[#4B1F7A] text-[#FAF7F0] text-xs hover:bg-[#2A1245] transition-colors"
              >
                เปลี่ยนรูป
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1 bg-red-800 text-white text-xs hover:bg-red-900 transition-colors"
              >
                ลบรูป
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Upload Tab */}
      {tab === 'upload' && !currentUrl && (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#4B1F7A]/25 hover:border-[#B8923A] transition-colors cursor-pointer p-6 flex flex-col items-center justify-center text-center bg-white/50"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <svg className="w-8 h-8 text-[#9C7A2B] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium text-[#2A1245]">
            {isUploading ? 'กำลังบีบอัดและอัปโหลด...' : 'คลิกเพื่อเลือกรูปภาพ หรือถ่ายจากมือถือ'}
          </p>
          <p className="text-xs text-[#1B1226]/60 mt-1">
            รองรับไฟล์ JPG, PNG, WebP (บีบอัดลงฐานข้อมูลอัตโนมัติ)
          </p>

          {isUploading && (
            <div className="w-full max-w-xs bg-stone-200 h-1.5 mt-3 overflow-hidden rounded-full">
              <div
                className="bg-[#B8923A] h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* URL Tab */}
      {tab === 'url' && !currentUrl && (
        <form onSubmit={handleUrlSubmit} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 input-underline text-xs"
              required
            />
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 py-1.5 bg-[#4B1F7A] text-[#FAF7F0] text-xs hover:bg-[#2A1245] transition-colors"
            >
              นำเข้า
            </button>
          </div>
          <p className="text-[11px] text-[#1B1226]/60">
            วางลิงก์รูปภาพโดยตรงที่เปิดดูได้สาธารณะ
          </p>
        </form>
      )}

      {/* Alt Text Input (Required for accessibility) */}
      <div className="pt-2 border-t border-[#4B1F7A]/10">
        <label className="block text-[11px] font-medium text-[#2A1245] mb-1">
          คำอธิบายรูปภาพ (Alt Text ภาษาไทย - สำหรับการเข้าถึงและ SEO)
        </label>
        <input
          type="text"
          value={altText}
          onChange={(e) => {
            const nextAlt = e.target.value;
            setAltText(nextAlt);
            if (currentUrl) {
              onChange({
                url: currentUrl,
                alt: nextAlt
              });
            }
          }}
          placeholder="เช่น พิธีไหว้ครูประจำปีการศึกษา 2569"
          className="w-full text-xs input-underline"
        />
      </div>

      {errorMsg && (
        <p className="text-xs text-[#9B1C31] bg-red-50 p-2 border-l-2 border-[#9B1C31]">
          {errorMsg}
        </p>
      )}
    </div>
  );
};
