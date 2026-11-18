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
  maxSizeMB?: number;
  hideUrlTab?: boolean;
  hideAltText?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  aspectRatioLabel = "สัดส่วนแนะนำ 3:2 หรือ 4:5",
  folder = "uploads",
  maxDimension = 1600,
  maxSizeMB,
  hideUrlTab = false,
  hideAltText = false,
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
        maxSizeMB,
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
    <div className="border border-gold-border/20 bg-surface p-4 rounded-sm space-y-3">
      <div className="flex items-center justify-between border-b border-gold-border/15 pb-2">
        <div className="flex items-center gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`pb-1 transition-colors ${tab === 'upload' ? 'border-b-2 border-gold text-heading font-semibold' : 'text-text-muted hover:text-heading'}`}
          >
            อัปโหลดไฟล์จากเครื่อง / ถ่ายภาพ
          </button>
          {!hideUrlTab && (
            <button
              type="button"
              onClick={() => setTab('url')}
              className={`pb-1 transition-colors ${tab === 'url' ? 'border-b-2 border-gold text-heading font-semibold' : 'text-text-muted hover:text-heading'}`}
            >
              ระบุลิงก์รูปภาพ (URL)
            </button>
          )}
        </div>
        <span className="text-[11px] text-gold-text">{aspectRatioLabel}</span>
      </div>

      {/* Preview if exists */}
      {currentUrl ? (
        <div className="relative group border border-gold-border/30 overflow-hidden bg-bg-alt max-h-64 flex items-center justify-center">
          <img
            src={currentUrl}
            alt={altText || "พรีวิวรูปภาพ"}
            className="max-h-64 w-auto object-contain"
          />
          <div className="absolute inset-0 bg-anchor-bg/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 text-anchor-text text-xs">
            {!hideAltText && (
              <p className="line-clamp-1 text-center font-medium">{altText || "ไม่มีคำอธิบาย alt"}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 bg-brand text-brand-contrast text-xs hover:bg-brand-hover transition-colors"
              >
                เปลี่ยนรูป
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1 bg-error text-brand-contrast text-xs hover:opacity-90 transition-opacity"
              >
                ลบรูป
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Upload Tab */}
      {(hideUrlTab || tab === 'upload') && !currentUrl && (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className="border-2 border-dashed border-gold-border/30 hover:border-gold transition-colors cursor-pointer p-6 flex flex-col items-center justify-center text-center bg-bg-alt/40"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <svg className="w-8 h-8 text-gold-text mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium text-heading">
            {isUploading ? 'กำลังบีบอัดและอัปโหลด...' : 'คลิกเพื่อเลือกรูปภาพ หรือถ่ายจากมือถือ'}
          </p>
          <p className="text-xs text-text-muted mt-1">
            รองรับไฟล์ JPG, PNG, WebP (บีบอัดลงฐานข้อมูลอัตโนมัติ)
          </p>

          {isUploading && (
            <div className="w-full max-w-xs bg-bg-alt h-1.5 mt-3 overflow-hidden rounded-full">
              <div
                className="bg-gold h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* URL Tab */}
      {!hideUrlTab && tab === 'url' && !currentUrl && (
        <form onSubmit={handleUrlSubmit} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 input-underline text-xs"
              required
            />
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 py-1.5 bg-brand text-brand-contrast text-xs hover:bg-brand-hover transition-colors"
            >
              นำเข้า
            </button>
          </div>
          <p className="text-[11px] text-text-muted">
            วางลิงก์รูปภาพโดยตรงที่เปิดดูได้สาธารณะ
          </p>
        </form>
      )}

      {/* Alt Text Input (Required for accessibility) */}
      {!hideAltText && (
        <div className="pt-2 border-t border-gold-border/15">
          <label className="block text-[11px] font-medium text-heading mb-1">
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
            className="w-full text-xs input-underline"
          />
        </div>
      )}

      {errorMsg && (
        <p className="text-xs text-error bg-error-bg p-2 border-l-2 border-error">
          {errorMsg}
        </p>
      )}
    </div>
  );
};
