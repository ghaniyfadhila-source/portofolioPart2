// ==========================================================================
// assets/main.js — Interaksi UI Aksesibel & Pemuat Idle Modul 3D
// ==========================================================================

(() => {
    'use strict';

    // 1. Menu Mobile Aksesibel (aria-expanded, Escape, manajemen fokus)
    const menuToggle = document.getElementById('menuToggle');
    const siteNav = document.getElementById('siteNav');
    const iconOpen = document.getElementById('menuIconOpen');
    const iconClose = document.getElementById('menuIconClose');

    function setMenuState(isOpen) {
        if (!menuToggle || !siteNav) return;
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        menuToggle.setAttribute('aria-label', isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi');
        siteNav.classList.toggle('is-open', isOpen);
        if (iconOpen && iconClose) {
            iconOpen.style.display = isOpen ? 'none' : 'block';
            iconClose.style.display = isOpen ? 'block' : 'none';
        }
    }

    if (menuToggle && siteNav) {
        menuToggle.addEventListener('click', () => {
            const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
            setMenuState(!expanded);
            if (!expanded) {
                const firstLink = siteNav.querySelector('a');
                if (firstLink) firstLink.focus();
            }
        });

        siteNav.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => setMenuState(false));
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
                setMenuState(false);
                menuToggle.focus();
            }
        });
    }

    // 2. Handler Anchor Aman terhadap "#" & Hormati prefers-reduced-motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            const rawHash = anchor.getAttribute('href');
            if (!rawHash || rawHash === '#') {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: reducedMotionQuery.matches ? 'auto' : 'smooth'
                });
                return;
            }

            let target = null;
            try {
                target = document.querySelector(rawHash);
            } catch {
                return;
            }

            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: reducedMotionQuery.matches ? 'auto' : 'smooth',
                    block: 'start'
                });
                history.replaceState(null, '', rawHash);
            }
        });
    });

    // 3. Satu IntersectionObserver untuk Active Nav (Tanpa Listener Scroll)
    const navLinks = new Map();
    document.querySelectorAll('.site-nav .nav-link').forEach((link) => {
        const hash = link.getAttribute('href');
        if (hash && hash.startsWith('#')) {
            navLinks.set(hash.slice(1), link);
        }
    });

    if ('IntersectionObserver' in window && navLinks.size > 0) {
        const navObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id;
                        navLinks.forEach((link, key) => {
                            if (key === id) {
                                link.setAttribute('aria-current', 'true');
                            } else {
                                link.removeAttribute('aria-current');
                            }
                        });
                    }
                });
            },
            {
                rootMargin: '-35% 0px -55% 0px',
                threshold: 0
            }
        );

        navLinks.forEach((_, id) => {
            const section = document.getElementById(id);
            if (section) navObserver.observe(section);
        });
    }

    // 4. Pemuatan Dinamis Three.js Hanya di Desktop (min-width: 1024px, pointer: fine)
    //    & prefers-reduced-motion Tidak Aktif, Setelah load + requestIdleCallback
    const canRun3D =
        window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches &&
        !reducedMotionQuery.matches;

    function schedule3DInit() {
        if (!canRun3D) return;
        const loadModule = () => {
            import('/assets/iot-board-3d.js')
                .then((mod) => {
                    if (mod && typeof mod.initIoTBoardScene === 'function') {
                        mod.initIoTBoardScene();
                    }
                })
                .catch(() => {
                    // Fallback otomatis ke poster statis jika gagal memuat modul
                    document.documentElement.classList.remove('has-3d-ready');
                });
        };

        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(loadModule, { timeout: 2000 });
        } else {
            window.setTimeout(loadModule, 250);
        }
    }

    if (document.readyState === 'complete') {
        schedule3DInit();
    } else {
        window.addEventListener('load', schedule3DInit, { once: true, passive: true });
    }
})();