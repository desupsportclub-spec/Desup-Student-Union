/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { MainLayout } from './components/layout/MainLayout';
import { AdminAuthProvider } from './admin/AdminAuthContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { Emblem } from './components/common/Emblem';

// Lazy-load all pages for optimal performance & code splitting
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const News = lazy(() => import('./pages/News').then(m => ({ default: m.News })));
const NewsDetail = lazy(() => import('./pages/NewsDetail').then(m => ({ default: m.NewsDetail })));
const CalendarPage = lazy(() => import('./pages/Calendar').then(m => ({ default: m.CalendarPage })));
const Downloads = lazy(() => import('./pages/Downloads').then(m => ({ default: m.Downloads })));
const AboutEmblem = lazy(() => import('./pages/about/AboutEmblem').then(m => ({ default: m.AboutEmblem })));
const AboutAuthority = lazy(() => import('./pages/about/AboutAuthority').then(m => ({ default: m.AboutAuthority })));
const AboutBoard = lazy(() => import('./pages/about/AboutBoard').then(m => ({ default: m.AboutBoard })));
const AboutAdvisors = lazy(() => import('./pages/about/AboutAdvisors').then(m => ({ default: m.AboutAdvisors })));
const AboutHall = lazy(() => import('./pages/about/AboutHall').then(m => ({ default: m.AboutHall })));
const Transparency = lazy(() => import('./pages/Transparency').then(m => ({ default: m.Transparency })));
const Complaint = lazy(() => import('./pages/Complaint').then(m => ({ default: m.Complaint })));
const TrackComplaint = lazy(() => import('./pages/TrackComplaint').then(m => ({ default: m.TrackComplaint })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

// Admin Lazy Pages
const AdminLayout = lazy(() => import('./admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminBanners = lazy(() => import('./admin/AdminBanners').then(m => ({ default: m.AdminBanners })));
const AdminNews = lazy(() => import('./admin/AdminNews').then(m => ({ default: m.AdminNews })));
const AdminEvents = lazy(() => import('./admin/AdminEvents').then(m => ({ default: m.AdminEvents })));
const AdminDownloads = lazy(() => import('./admin/AdminDownloads').then(m => ({ default: m.AdminDownloads })));
const AdminPeople = lazy(() => import('./admin/AdminPeople').then(m => ({ default: m.AdminPeople })));
const AdminBudgets = lazy(() => import('./admin/AdminBudgets').then(m => ({ default: m.AdminBudgets })));
const AdminComplaints = lazy(() => import('./admin/AdminComplaints').then(m => ({ default: m.AdminComplaints })));
const AdminUsers = lazy(() => import('./admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminSettings = lazy(() => import('./admin/AdminSettings').then(m => ({ default: m.AdminSettings })));

// Loading Fallback Spinner
const PageFallback: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-12">
    <Emblem size={44} animate />
    <span className="text-xs text-[#9C7A2B] mt-4 font-serif tracking-wider">กำลังโหลด...</span>
  </div>
);

const router = createBrowserRouter([
  // Public Portal with MainLayout
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageFallback />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: 'news',
        element: (
          <Suspense fallback={<PageFallback />}>
            <News />
          </Suspense>
        ),
      },
      {
        path: 'news/:category',
        element: (
          <Suspense fallback={<PageFallback />}>
            <News />
          </Suspense>
        ),
      },
      {
        path: 'news/read/:id',
        element: (
          <Suspense fallback={<PageFallback />}>
            <NewsDetail />
          </Suspense>
        ),
      },
      {
        path: 'calendar',
        element: (
          <Suspense fallback={<PageFallback />}>
            <CalendarPage />
          </Suspense>
        ),
      },
      {
        path: 'downloads',
        element: (
          <Suspense fallback={<PageFallback />}>
            <Downloads />
          </Suspense>
        ),
      },
      {
        path: 'about/emblem',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AboutEmblem />
          </Suspense>
        ),
      },
      {
        path: 'about/authority',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AboutAuthority />
          </Suspense>
        ),
      },
      {
        path: 'about/board',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AboutBoard />
          </Suspense>
        ),
      },
      {
        path: 'about/advisors',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AboutAdvisors />
          </Suspense>
        ),
      },
      {
        path: 'about/hall',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AboutHall />
          </Suspense>
        ),
      },
      {
        path: 'transparency',
        element: (
          <Suspense fallback={<PageFallback />}>
            <Transparency />
          </Suspense>
        ),
      },
      {
        path: 'complaint',
        element: (
          <Suspense fallback={<PageFallback />}>
            <Complaint />
          </Suspense>
        ),
      },
      {
        path: 'track',
        element: (
          <Suspense fallback={<PageFallback />}>
            <TrackComplaint />
          </Suspense>
        ),
      },
      {
        path: 'contact',
        element: (
          <Suspense fallback={<PageFallback />}>
            <Contact />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<PageFallback />}>
            <NotFound />
          </Suspense>
        ),
      },
    ],
  },

  // Admin Portal with AdminLayout
  {
    path: '/admin',
    element: (
      <Suspense fallback={<PageFallback />}>
        <AdminLayout />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageFallback />}>
            <AdminDashboard />
          </Suspense>
        ),
      },
      {
        path: 'banners',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AdminBanners />
          </Suspense>
        ),
      },
      {
        path: 'news',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AdminNews />
          </Suspense>
        ),
      },
      {
        path: 'events',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AdminEvents />
          </Suspense>
        ),
      },
      {
        path: 'downloads',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AdminDownloads />
          </Suspense>
        ),
      },
      {
        path: 'people',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AdminPeople />
          </Suspense>
        ),
      },
      {
        path: 'budgets',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AdminBudgets />
          </Suspense>
        ),
      },
      {
        path: 'complaints',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AdminComplaints />
          </Suspense>
        ),
      },
      {
        path: 'users',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AdminUsers />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AdminSettings />
          </Suspense>
        ),
      },
    ],
  },
]);

export default function App() {
  return (
    <HelmetProvider>
      <AdminAuthProvider>
        <SiteSettingsProvider>
          <RouterProvider router={router} />
        </SiteSettingsProvider>
      </AdminAuthProvider>
    </HelmetProvider>
  );
}
