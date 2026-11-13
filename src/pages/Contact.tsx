/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { SectionEyebrow, CornerBracket } from '../components/common/Ornament';
import { SuccessCheck } from '../components/SuccessCheck';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { SITE_CONFIG } from '../config/site';

export const Contact: React.FC = () => {
  const { contactInfo } = useSiteSettings();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      await addDoc(collection(db, 'messages'), {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        createdAt: new Date().toISOString()
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error("Message send error:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="border-b border-[#B8923A]/30 pb-5 sm:pb-6 text-center max-w-xl mx-auto space-y-2">
        <SectionEyebrow enText="GET IN TOUCH" thText="ติดต่อองค์การนักเรียน" />
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1B1226]">
          ติดต่อและที่ทำการ
        </h1>
        <p className="text-xs md:text-sm text-[#1B1226]/70">
          โรงเรียนสาธิตมหาวิทยาลัยพะเยา
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left 5 Cols: Contact Information */}
        <div className="lg:col-span-5 space-y-5 sm:space-y-6">
          <div className="bg-[#FAF7F0] border border-[#B8923A]/30 p-5 sm:p-6 rounded-sm shadow-editorial space-y-4">
            <h2 className="font-serif text-xl font-semibold text-[#2A1245]">
              ข้อมูลการติดต่อ
            </h2>

            <div className="space-y-3 text-xs md:text-sm text-[#1B1226]/80 leading-relaxed">
              <div>
                <span className="font-semibold text-[#4B1F7A] block">สถานที่ตั้ง:</span>
                <span>{contactInfo.address}</span>
              </div>

              <div>
                <span className="font-semibold text-[#4B1F7A] block">โทรศัพท์:</span>
                <span>{contactInfo.phone}</span>
              </div>

              <div>
                <span className="font-semibold text-[#4B1F7A] block">อีเมล:</span>
                <span>{contactInfo.email}</span>
              </div>

              <div>
                <span className="font-semibold text-[#4B1F7A] block">Facebook Page:</span>
                <a
                  href={contactInfo.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#9C7A2B] hover:underline"
                >
                  {contactInfo.facebook} ↗
                </a>
              </div>
            </div>
          </div>

          {/* School Coordinates Note */}
          <div className="p-4 bg-[#EDE6F5]/50 border-l-2 border-[#B8923A] rounded-r-sm text-xs text-[#2A1245]">
            <p className="font-medium font-serif">เวลาทำการสำนักงานองค์การนักเรียน:</p>
            <p className="text-[#1B1226]/70 mt-1">วันจันทร์ - วันศุกร์ เวลา 07:30 - 17:00 น. (เว้นวันหยุดราชการ)</p>
          </div>
        </div>

        {/* Right 7 Cols: Quick Message Form */}
        <div className="lg:col-span-7">
          <div className="bg-[#FAF7F0] border border-[#4B1F7A]/15 p-5 sm:p-6 md:p-8 rounded-sm shadow-editorial relative">
            <CornerBracket position="top-left" />
            <CornerBracket position="top-right" />
            <CornerBracket position="bottom-left" />
            <CornerBracket position="bottom-right" />

            <h2 className="font-serif text-xl font-semibold text-[#2A1245] mb-2">
              ส่งข้อความสอบถาม
            </h2>
            <p className="text-xs text-[#1B1226]/60 mb-6">
              หากมีคำถามทั่วไปที่ไม่ใช่เรื่องร้องเรียน สามารถส่งข้อความผ่านแบบฟอร์มนี้ได้
            </p>

            {success ? (
              <div className="py-6 text-center space-y-5">
                <div className="flex justify-center">
                  <SuccessCheck size={120} />
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2, duration: 0.5 }}
                  className="space-y-3"
                >
                  <p className="font-serif text-xl font-semibold text-[#2A1245]">
                    ส่งข้อความเรียบร้อยแล้ว
                  </p>
                  <p className="text-xs text-[#1B1226]/70">
                    ขอบคุณสำหรับการติดต่อ คณะทำงานจะตอบกลับโดยเร็วที่สุด
                  </p>
                  <button
                    type="button"
                    onClick={() => setSuccess(false)}
                    className="px-5 py-2 border border-[#B8923A]/50 text-xs font-medium text-[#4B1F7A] hover:bg-[#EDE6F5] rounded-sm transition-colors"
                  >
                    ส่งข้อความอื่นเพิ่มเติม
                  </button>
                </motion.div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 text-[#9B1C31] text-xs border-l-2 border-[#9B1C31]">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#2A1245] mb-1">
                      ชื่อ-นามสกุล *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs input-underline"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#2A1245] mb-1">
                      อีเมลสำหรับติดต่อกลับ *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs input-underline"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2A1245] mb-1">
                    หัวข้อเรื่อง *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-xs input-underline"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2A1245] mb-1">
                    ข้อความ *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full text-xs input-underline"
                    required
                  />
                </div>

                <div className="pt-2 text-right">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2.5 bg-[#4B1F7A] text-[#FAF7F0] text-xs font-medium rounded-full border border-[#D9B867]/40 hover:bg-[#2A1245] transition-colors shadow-editorial"
                  >
                    {loading ? 'กำลังส่ง...' : 'ส่งข้อความ →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Google Maps */}
      <div className="space-y-3 pt-6 border-t border-[#4B1F7A]/15">
        <h3 className="font-serif text-lg font-semibold text-[#2A1245]">
          แผนที่โรงเรียนสาธิตมหาวิทยาลัยพะเยา
        </h3>
        <div className="w-full h-64 sm:h-80 rounded-sm overflow-hidden border border-[#B8923A]/30 shadow-editorial">
          <iframe
            src={SITE_CONFIG.contact.mapIframeUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="แผนที่โรงเรียนสาธิตมหาวิทยาลัยพะเยา"
          />
        </div>
      </div>
    </div>
  );
};
