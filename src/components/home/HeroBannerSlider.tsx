/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { BannerItem } from '../../types';

interface HeroBannerSliderProps {
  banners: BannerItem[];
}

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = ({ banners }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 25 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const displayBanners: BannerItem[] = banners;

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || displayBanners.length === 0) return;
    emblaApi.on('select', onSelect);
    onSelect();

    // Autoplay timer (5 seconds)
    const interval = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      }
    }, 5500);

    return () => {
      clearInterval(interval);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect, displayBanners.length]);

  if (displayBanners.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full overflow-hidden border-b border-[#B8923A]/40 bg-[#2A1245]">
      <div className="relative w-full shadow-editorial group bg-[#2A1245]">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {displayBanners.map((banner, index) => {
              const hasText = Boolean(banner.title?.trim() || banner.subtitle?.trim());
              const BannerContent = (
                <div className="relative w-full aspect-[16/9] sm:aspect-[16/8] lg:aspect-[21/9] min-h-[260px] sm:min-h-[400px] lg:min-h-[540px] max-h-[680px] overflow-hidden bg-[#2A1245] flex items-center justify-center">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title || 'แบนเนอร์องค์การนักเรียน'}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  />
                  {hasText && (
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1B1226]/75 via-[#1B1226]/15 to-transparent flex flex-col justify-end px-6 py-6 sm:px-10 sm:py-10 md:px-14 md:py-12 pointer-events-none">
                      <div className="max-w-[1240px] w-full mx-auto space-y-1.5 sm:space-y-2">
                        {banner.title?.trim() && (
                          <h2 className="font-serif text-xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-md line-clamp-2 max-w-3xl">
                            {banner.title}
                          </h2>
                        )}
                        {banner.subtitle?.trim() && (
                          <p className="text-xs sm:text-base text-white/90 drop-shadow line-clamp-1 sm:line-clamp-2 max-w-3xl">
                            {banner.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );

              return (
                <div key={banner.id || index} className="flex-[0_0_100%] min-w-0 relative">
                  {banner.linkUrl ? (
                    banner.linkUrl.startsWith('http') ? (
                      <a
                        href={banner.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block cursor-pointer"
                      >
                        {BannerContent}
                      </a>
                    ) : (
                      <Link to={banner.linkUrl} className="block cursor-pointer">
                        {BannerContent}
                      </Link>
                    )
                  ) : (
                    BannerContent
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Arrows */}
          {displayBanners.length > 1 && (
            <>
              <button
                type="button"
                onClick={scrollPrev}
                aria-label="Previous Slide"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#2A1245]/70 hover:bg-[#2A1245] text-white border border-[#B8923A]/50 flex items-center justify-center backdrop-blur-sm transition-all opacity-80 hover:opacity-100 z-10"
              >
                <svg className="w-5 h-5 text-[#FAF7F0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={scrollNext}
                aria-label="Next Slide"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#2A1245]/70 hover:bg-[#2A1245] text-white border border-[#B8923A]/50 flex items-center justify-center backdrop-blur-sm transition-all opacity-80 hover:opacity-100 z-10"
              >
                <svg className="w-5 h-5 text-[#FAF7F0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Dots Indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                {displayBanners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollTo(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      idx === selectedIndex ? 'w-6 bg-[#D9B867]' : 'w-2 bg-white/60 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
          </>
        )}
      </div>
    </section>
  );
};
