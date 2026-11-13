/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, onAuthStateChanged, signInWithGoogle, signOutAdmin, db } from '../lib/firebase';
import { AdminRole, AdminUser } from '../types';
import { SITE_CONFIG } from '../config/site';

interface AdminAuthContextType {
  user: User | null;
  adminData: AdminUser | null;
  role: AdminRole | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthorized: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isEditor: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        const email = currentUser.email.toLowerCase();

        try {
          const adminRef = doc(db, 'admins', email);
          const snap = await getDoc(adminRef);

          if (snap.exists() && snap.data().active) {
            const data = snap.data() as AdminUser;
            setAdminData(data);
            setRole(data.role);
          } else if (SITE_CONFIG.bootstrapAdmins.map(e => e.toLowerCase()).includes(email)) {
            // Auto bootstrap initial Super Admin
            const initialAdmin: AdminUser = {
              email,
              displayName: currentUser.displayName || 'Super Admin',
              role: 'super_admin',
              active: true,
              addedBy: 'system_bootstrap',
              addedAt: new Date().toISOString()
            };
            await setDoc(adminRef, initialAdmin);
            setAdminData(initialAdmin);
            setRole('super_admin');
          } else {
            setAdminData(null);
            setRole(null);
          }
        } catch (err) {
          console.error("Error verifying admin role:", err);
          // Check if bootstrap admin
          if (SITE_CONFIG.bootstrapAdmins.map(e => e.toLowerCase()).includes(email)) {
            setRole('super_admin');
          }
        }
      } else {
        setAdminData(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOutAdmin();
    setUser(null);
    setAdminData(null);
    setRole(null);
  };

  const isAuthorized = role !== null;
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'super_admin' || role === 'admin';
  const isEditor = role === 'super_admin' || role === 'admin' || role === 'editor';

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        adminData,
        role,
        loading,
        login,
        logout,
        isAuthorized,
        isSuperAdmin,
        isAdmin,
        isEditor
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};
