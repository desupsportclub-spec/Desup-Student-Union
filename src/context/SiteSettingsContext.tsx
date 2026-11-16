/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, getDoc, getDocFromCache, onSnapshot } from 'firebase/firestore';
import { db, testConnection } from '../lib/firebase';
import { RELATED_SYSTEM_LINKS, SITE_CONFIG } from '../config/site';
import { ComplaintStatsSummary, ServiceLink, SiteContactInfo } from '../types';

export interface SiteSettingsContextValue {
  academicYearTH: string;
  presidentHeadline: string;
  presidentHeadlineEn: string;
  presidentMessage: string;
  presidentMessageEn: string;
  ticker: string[];
  tickerEn: string[];
  links: ServiceLink[];
  contactInfo: Required<SiteContactInfo>;
  totalVisits: number;
  complaintStats: ComplaintStatsSummary;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const DEFAULT_HEADLINE = '"พวกเราพร้อมเป็นตัวแทนและรับฟังทุกเสียงของเพื่อนนักเรียนสาธิต มพ."';
const DEFAULT_ADDRESS_EN =
  'Demonstration School, University of Phayao, 19 Moo 2, Maeka, Mueang Phayao, Phayao 56000';
const DEFAULT_FACEBOOK_EN = 'Demonstration School of University of Phayao Student Union';

const DEFAULT_CONTACT: Required<SiteContactInfo> = {
  address: SITE_CONFIG.contact.address,
  addressEn: DEFAULT_ADDRESS_EN,
  phone: SITE_CONFIG.contact.phone,
  email: SITE_CONFIG.contact.email,
  facebook: SITE_CONFIG.contact.facebook,
  facebookEn: DEFAULT_FACEBOOK_EN,
  facebookUrl: SITE_CONFIG.contact.facebookUrl,
};

const DEFAULT_COMPLAINT_STATS: ComplaintStatsSummary = {
  total: 0,
  inProgress: 0,
  resolved: 0,
};

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  academicYearTH: SITE_CONFIG.currentAcademicYearTH,
  presidentHeadline: DEFAULT_HEADLINE,
  presidentHeadlineEn: '',
  presidentMessage: '',
  presidentMessageEn: '',
  ticker: [],
  tickerEn: [],
  links: RELATED_SYSTEM_LINKS,
  contactInfo: DEFAULT_CONTACT,
  totalVisits: 0,
  complaintStats: DEFAULT_COMPLAINT_STATS,
  loading: true,
  refreshSettings: async () => {},
});

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [academicYearTH, setAcademicYearTH] = useState<string>(SITE_CONFIG.currentAcademicYearTH);
  const [presidentHeadline, setPresidentHeadline] = useState<string>(DEFAULT_HEADLINE);
  const [presidentHeadlineEn, setPresidentHeadlineEn] = useState<string>('');
  const [presidentMessage, setPresidentMessage] = useState<string>('');
  const [presidentMessageEn, setPresidentMessageEn] = useState<string>('');
  const [ticker, setTicker] = useState<string[]>([]);
  const [tickerEn, setTickerEn] = useState<string[]>([]);
  const [links, setLinks] = useState<ServiceLink[]>(RELATED_SYSTEM_LINKS);
  const [contactInfo, setContactInfo] = useState<Required<SiteContactInfo>>(DEFAULT_CONTACT);
  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [complaintStats, setComplaintStats] = useState<ComplaintStatsSummary>(DEFAULT_COMPLAINT_STATS);
  const [loading, setLoading] = useState<boolean>(true);

  const applyDocData = useCallback((data: Record<string, any> | undefined) => {
    if (!data) return;
    if (data.academicYearTH && typeof data.academicYearTH === 'string') {
      setAcademicYearTH(data.academicYearTH.trim() || SITE_CONFIG.currentAcademicYearTH);
    }
    if (typeof data.presidentHeadline === 'string' && data.presidentHeadline.trim()) {
      setPresidentHeadline(data.presidentHeadline.trim());
    }
    if (typeof data.presidentHeadlineEn === 'string') {
      setPresidentHeadlineEn(data.presidentHeadlineEn.trim());
    }
    if (typeof data.presidentMessage === 'string') {
      setPresidentMessage(data.presidentMessage);
    }
    if (typeof data.presidentMessageEn === 'string') {
      setPresidentMessageEn(data.presidentMessageEn);
    }
    if (Array.isArray(data.ticker)) {
      setTicker(data.ticker);
    }
    if (Array.isArray(data.tickerEn)) {
      setTickerEn(data.tickerEn);
    }
    if (Array.isArray(data.links) && data.links.length > 0) {
      setLinks(data.links);
    }
    if (data.contactInfo && typeof data.contactInfo === 'object') {
      const rawPhone = String(data.contactInfo.phone || '').trim();
      const rawEmail = String(data.contactInfo.email || '').trim();
      const resolvedAddress = data.contactInfo.address || DEFAULT_CONTACT.address;
      const resolvedAddressEn =
        typeof data.contactInfo.addressEn === 'string' && data.contactInfo.addressEn.trim()
          ? data.contactInfo.addressEn.trim()
          : resolvedAddress === DEFAULT_CONTACT.address
          ? DEFAULT_ADDRESS_EN
          : '';
      const resolvedFacebook = data.contactInfo.facebook || DEFAULT_CONTACT.facebook;
      const resolvedFacebookEn =
        typeof data.contactInfo.facebookEn === 'string' && data.contactInfo.facebookEn.trim()
          ? data.contactInfo.facebookEn.trim()
          : resolvedFacebook === DEFAULT_CONTACT.facebook
          ? DEFAULT_FACEBOOK_EN
          : '';

      setContactInfo({
        address: resolvedAddress,
        addressEn: resolvedAddressEn,
        phone:
          !rawPhone || rawPhone === '054-466-666 ต่อ 1450-1452'
            ? DEFAULT_CONTACT.phone
            : rawPhone,
        email:
          !rawEmail ||
          rawEmail.toLowerCase() === 'desup.council@up.ac.th' ||
          rawEmail.toLowerCase() === 'satit.su@up.ac.th'
            ? DEFAULT_CONTACT.email
            : rawEmail,
        facebook: resolvedFacebook,
        facebookEn: resolvedFacebookEn,
        facebookUrl: data.contactInfo.facebookUrl || DEFAULT_CONTACT.facebookUrl,
      });
    }
    if (typeof data.totalVisits === 'number') {
      setTotalVisits(data.totalVisits);
    }
    if (data.complaintStats && typeof data.complaintStats === 'object') {
      const total = typeof data.complaintStats.total === 'number' ? data.complaintStats.total : 0;
      const inProgress =
        typeof data.complaintStats.inProgress === 'number' ? data.complaintStats.inProgress : 0;
      const resolved =
        typeof data.complaintStats.resolved === 'number' ? data.complaintStats.resolved : 0;
      setComplaintStats({ total, inProgress, resolved });
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'site'));
      if (snap.exists()) {
        applyDocData(snap.data());
      }
    } catch (err) {
      console.warn('Could not refresh site settings:', err);
    } finally {
      setLoading(false);
    }
  }, [applyDocData]);

  useEffect(() => {
    void testConnection();
    const settingsRef = doc(db, 'settings', 'site');

    // โหลดข้อมูลเริ่มต้นจากแคช IndexedDB เพื่อแสดงผลทันทีโดยไม่ต้องรอเครือข่าย
    getDocFromCache(settingsRef)
      .then((snap) => {
        if (snap.exists()) {
          applyDocData(snap.data());
          setLoading(false);
        }
      })
      .catch(() => {});

    const unsub = onSnapshot(
      settingsRef,
      (snap) => {
        if (snap.exists()) {
          applyDocData(snap.data());
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Site settings listener error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [applyDocData]);

  return (
    <SiteSettingsContext.Provider
      value={{
        academicYearTH,
        presidentHeadline,
        presidentHeadlineEn,
        presidentMessage,
        presidentMessageEn,
        ticker,
        tickerEn,
        links,
        contactInfo,
        totalVisits,
        complaintStats,
        loading,
        refreshSettings,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};

export function useSiteSettings(): SiteSettingsContextValue {
  return useContext(SiteSettingsContext);
}
