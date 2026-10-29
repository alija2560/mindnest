'use client';

import { useEffect } from 'react';

export default function PreventBackCache() {
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // اگر صفحه از حافظه BFCache مرورگر (Back/Forward) لود شده باشد
      if (event.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  return null;
}