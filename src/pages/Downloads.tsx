/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DownloadItem } from '../types';
import { formatDate } from '../lib/format';
import { SectionEyebrow, CornerBracket } from '../components/common/Ornament';
import { SeoHead } from '../components/common/SeoHead';
import { useLanguage } from '../context/LanguageContext';
import { resolveDownloadUrl } from '../lib/downloadStorage';
import { getCachedDownloadsSync, loadDownloads } from '../lib/publicDataService';
import { pickL10n } from '../lib/l10n';
import { FallbackLangBadge } from '../components/common/FallbackLangBadge';

export const Downloads: React.FC = () => {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const initialDownloads = getCachedDownloadsSync();
  const [downloads, setDownloads] = useState<DownloadItem[]>(initialDownloads || []);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(!initialDownloads);

  const [previewItem, setPreviewItem] = useState<DownloadItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewIsBlob, setPreviewIsBlob] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const pdfFrameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let active = true;
    loadDownloads((list) => {
      if (!active) return;
      setDownloads(list);
      setLoading(false);
    })
      .catch((err) => {
        console.warn('Could not load downloads:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewIsBlob && previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewIsBlob, previewUrl]);

  const handleDownloadCount = async (item: DownloadItem) => {
    if (!item.id) return;
    try {
      await updateDoc(doc(db, 'downloads', item.id), {
        downloads: increment(1)
      });
      setDownloads(prev =>
        prev.map(d => d.id === item.id ? { ...d, downloads: (d.downloads || 0) + 1 } : d)
      );
    } catch {
      // ข้ามหากอัปเดตตัวนับไม่ได้
    }
  };

  const closePreview = () => {
    if (previewIsBlob && previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewItem(null);
    setPreviewUrl('');
    setPreviewIsBlob(false);
    setPreviewError(null);
  };

  const openPreview = async (item: DownloadItem) => {
    if (previewIsBlob && previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewItem(item);
    setPreviewUrl('');
    setPreviewIsBlob(false);
    setPreviewError(null);
    setPreviewLoading(true);

    try {
      const resolved = await resolveDownloadUrl(item);
      setPreviewUrl(resolved.url);
      setPreviewIsBlob(resolved.isBlob);
    } catch (err) {
      console.error('Could not resolve preview file:', err);
      setPreviewError(t('downloads.previewError'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const triggerDownload = async (item: DownloadItem, existingResolvedUrl?: string) => {
    if (!item.id) return;
    setDownloadingId(item.id);
    try {
      await handleDownloadCount(item);
      let targetUrl = existingResolvedUrl || '';
      let shouldRevoke = false;

      if (!targetUrl) {
        const resolved = await resolveDownloadUrl(item);
        targetUrl = resolved.url;
        shouldRevoke = resolved.isBlob;
      }

      const displayTitle = pickL10n(item.title, item.titleEn, lang).text || item.title;
      const ext = item.fileType && !displayTitle.toLowerCase().endsWith(`.${item.fileType.toLowerCase()}`)
        ? `.${item.fileType.toLowerCase()}`
        : '';
      const link = document.createElement('a');
      link.href = targetUrl;
      link.download = `${displayTitle}${ext}`;
      if (!shouldRevoke && !targetUrl.startsWith('blob:')) {
        link.target = '_blank';
        link.rel = 'noreferrer';
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (shouldRevoke) {
        setTimeout(() => URL.revokeObjectURL(targetUrl), 10000);
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrint = () => {
    if (!previewItem || !previewUrl) return;
    try {
      if (pdfFrameRef.current && pdfFrameRef.current.contentWindow) {
        pdfFrameRef.current.contentWindow.focus();
        pdfFrameRef.current.contentWindow.print();
      } else {
        const win = window.open(previewUrl, '_blank');
        win?.focus();
        win?.print();
      }
    } catch {
      window.open(previewUrl, '_blank');
    }
  };

  const filtered = downloads.filter((d) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      d.title.toLowerCase().includes(q) ||
      (d.titleEn || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 space-y-6 sm:space-y-10">
      <SeoHead titleKey="seo.pages.downloads.title" descriptionKey="seo.pages.downloads.desc" />

      {/* ส่วนหัวหน้าดาวน์โหลด */}
      <div className="border-b border-gold-border/30 pb-5 sm:pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <SectionEyebrow enText={t('downloads.eyebrowEn')} thText={t('downloads.eyebrowTh')} />
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-heading mt-2">
            {t('downloads.title')}
          </h1>
        </div>

        <div className="w-full md:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('downloads.searchPlaceholder')}
            className="w-full text-xs input-underline"
          />
        </div>
      </div>

      {/* รายการเอกสาร */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-bg-alt/60 rounded-sm" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="border border-gold-border/20 bg-surface rounded-sm shadow-editorial overflow-hidden">
          <div className="md:hidden divide-y divide-gold-border/15">
            {filtered.map((item) => {
              const titleRes = pickL10n(item.title, item.titleEn, lang);
              return (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-serif text-base font-semibold text-heading leading-snug">
                      {titleRes.text}
                    </h3>
                    <FallbackLangBadge show={titleRes.isFallback} />
                  </div>
                  <span className="font-mono text-[10px] tracking-wider px-2 py-0.5 border border-gold/60 rounded-sm text-gold-text uppercase font-bold shrink-0">
                    {item.fileType}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
                  <span>{formatDate(item.createdAt, lang, true)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openPreview(item)}
                    className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 border border-gold text-gold-text hover:bg-brand-soft rounded-sm text-xs font-medium transition-colors"
                  >
                    <span>{t('downloads.view')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerDownload(item)}
                    disabled={downloadingId === item.id}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand text-brand-contrast hover:bg-brand-hover transition-colors rounded-sm text-xs font-medium shadow-editorial-sm disabled:opacity-60"
                  >
                    <span>{downloadingId === item.id ? t('downloads.preparing') : t('downloads.download')}</span>
                  </button>
                </div>
              </div>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-soft/60 border-b border-gold-border/20 text-gold-text uppercase tracking-wider font-medium">
                <tr>
                  <th className="py-3 px-4">{t('downloads.table.name')}</th>
                  <th className="py-3 px-4">{t('downloads.table.type')}</th>
                  <th className="py-3 px-4">{t('downloads.table.date')}</th>
                  <th className="py-3 px-4 text-center" aria-label={t('downloads.table.actions')} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-border/15">
                {filtered.map((item) => {
                  const titleRes = pickL10n(item.title, item.titleEn, lang);
                  return (
                  <tr key={item.id} className="hover:bg-brand-soft/30 transition-colors">
                    <td className="py-4 px-4 font-serif text-sm font-semibold text-heading">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{titleRes.text}</span>
                        <FallbackLangBadge show={titleRes.isFallback} />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-[10px] tracking-wider px-2 py-0.5 border border-gold/60 rounded-sm text-gold-text uppercase font-bold">
                        {item.fileType}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-text-muted">
                      {formatDate(item.createdAt, lang, true)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openPreview(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-gold text-gold-text hover:bg-brand-soft rounded-sm text-xs font-medium transition-colors"
                        >
                          <span>{t('downloads.viewWithIcon')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => triggerDownload(item)}
                          disabled={downloadingId === item.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand text-brand-contrast hover:bg-brand-hover transition-colors rounded-sm text-xs font-medium shadow-editorial-sm disabled:opacity-60"
                        >
                          <span>{downloadingId === item.id ? t('downloads.preparingFile') : t('downloads.download')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center border border-dashed border-gold-border/30 rounded-sm bg-surface/50 space-y-2">
          <p className="font-serif text-lg text-heading">
            {search ? t('downloads.emptySearch', { term: search }) : t('downloads.emptyAll')}
          </p>
          <p className="text-xs text-text-muted">
            {t('downloads.emptyHint')}
          </p>
        </div>
      )}

      {/* หน้าต่างแสดงตัวอย่างเอกสาร PDF */}
      {previewItem && (() => {
        const previewTitleRes = pickL10n(previewItem.title, previewItem.titleEn, lang);
        return (
        <div className="fixed inset-0 z-50 bg-anchor-bg-deep/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-surface border-2 border-gold rounded-sm w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl relative overflow-hidden">
            <CornerBracket position="top-left" />
            <CornerBracket position="top-right" />
            <CornerBracket position="bottom-left" />
            <CornerBracket position="bottom-right" />

            <div className="p-4 sm:p-5 border-b border-gold-border/25 flex items-center justify-between bg-surface-elevated">
              <div className="pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gold-text">
                    {previewItem.fileType.toUpperCase()}
                  </span>
                  <FallbackLangBadge show={previewTitleRes.isFallback} />
                </div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-heading line-clamp-1">
                  {previewTitleRes.text}
                </h3>
              </div>
              <button
                type="button"
                onClick={closePreview}
                aria-label={t('downloads.closePreviewAria')}
                className="w-8 h-8 rounded-full border border-gold-border/30 flex items-center justify-center text-text-muted hover:text-heading hover:bg-bg-alt transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 bg-bg-alt/60 p-2 overflow-hidden flex items-center justify-center min-h-[50vh]">
              {previewLoading ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-heading font-medium">{t('downloads.previewLoading')}</p>
                </div>
              ) : previewError ? (
                <div className="p-12 text-center space-y-3 text-xs text-error">
                  <p className="font-semibold">{previewError}</p>
                </div>
              ) : (previewItem.fileType === 'pdf' || previewUrl.startsWith('blob:') || previewItem.fileUrl.endsWith('.pdf')) && previewUrl ? (
                <iframe
                  ref={pdfFrameRef}
                  src={previewUrl}
                  title={previewTitleRes.text}
                  className="w-full h-full min-h-[60vh] rounded-sm border border-gold-border/25 bg-surface-elevated"
                />
              ) : (
                <div className="p-12 text-center space-y-4">
                  <div className="text-4xl">📄</div>
                  <p className="font-serif text-base text-heading">
                    {t('downloads.nonPdfNotice', { type: previewItem.fileType.toUpperCase() })}
                  </p>
                  <button
                    type="button"
                    onClick={() => triggerDownload(previewItem, previewUrl)}
                    className="inline-block px-6 py-2.5 bg-brand text-brand-contrast hover:bg-brand-hover rounded text-xs font-medium transition-colors"
                  >
                    {t('downloads.clickToDownload')}
                  </button>
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 bg-surface-elevated border-t border-gold-border/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-[11px] text-text-muted">
                {t('downloads.modalMeta', {
                  date: formatDate(previewItem.createdAt, lang, true),
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!previewUrl}
                  className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 border border-gold text-heading hover:bg-brand-soft rounded-sm font-medium transition-colors disabled:opacity-50"
                >
                  <span>🖨️</span>
                  <span>{t('downloads.printDoc')}</span>
                </button>

                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 border border-gold-border/30 hover:bg-bg-alt rounded-sm text-text transition-colors"
                  >
                    <span>{t('downloads.openNewWindow')}</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => triggerDownload(previewItem, previewUrl)}
                  disabled={!previewUrl}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 bg-brand text-brand-contrast hover:bg-brand-hover rounded-sm font-medium shadow-editorial transition-colors disabled:opacity-50"
                >
                  <span>{t('downloads.downloadFile')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
};
