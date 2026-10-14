// ==========================================================================
// assets/iot-board-3d.js — Papan Mikrokontroler 3D & Jejak Sirkuit Belakang
// Impor spesifik untuk tree-shaking optimal dari vendor/three.module.min.js
// ==========================================================================

import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    Group,
    Mesh,
    BoxGeometry,
    CylinderGeometry,
    BufferGeometry,
    Float32BufferAttribute,
    MeshLambertMaterial,
    MeshBasicMaterial,
    LineSegments,
    LineBasicMaterial,
    AmbientLight,
    DirectionalLight,
    MathUtils
} from '/vendor/three.module.min.js';

export function initIoTBoardScene() {
    const canvas = document.getElementById('iot-board-canvas');
    const stage = document.getElementById('boardStage');
    const heroSection = document.getElementById('hero');
    if (!canvas || !stage) return;

    // Deteksi dukungan WebGL & pembuatan konteks hemat daya
    let renderer;
    try {
        renderer = new WebGLRenderer({
            canvas,
            alpha: true,
            antialias: false,
            powerPreference: 'low-power',
            preserveDrawingBuffer: window.location.search.includes('export-poster=1')
        });
    } catch {
        document.documentElement.classList.remove('has-3d-ready');
        return;
    }

    const gl = renderer.getContext();
    if (!gl) {
        renderer.dispose();
        document.documentElement.classList.remove('has-3d-ready');
        return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(stage.clientWidth, stage.clientHeight, false);

    const scene = new Scene();
    const camera = new PerspectiveCamera(36, stage.clientWidth / stage.clientHeight, 0.1, 30);
    camera.position.set(0, 0.2, 6.6);

    // Pencahayaan studio bersih
    const ambientLight = new AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new DirectionalLight(0xfffdf8, 1.15);
    keyLight.position.set(3.5, 5.0, 4.5);
    scene.add(keyLight);

    const rimLight = new DirectionalLight(0xd9dbd4, 0.45);
    rimLight.position.set(-4.0, -2.5, 2.0);
    scene.add(rimLight);

    // Palet Material Sesuai Token Desain
    const matPcbBody = new MeshLambertMaterial({ color: 0x17191c });
    const matChipBody = new MeshLambertMaterial({ color: 0x23262b });
    const matShield = new MeshLambertMaterial({ color: 0xd9dbd4 });
    const matHeaderPlastic = new MeshLambertMaterial({ color: 0x2b2e33 });
    const matPinMetal = new MeshLambertMaterial({ color: 0x9ea3ab });
    const matSilkscreen = new LineBasicMaterial({ color: 0x6b6f76 });
    const matTraceBg = new LineBasicMaterial({ color: 0xd9dbd4 });

    // Material LED Sinyal (#FF5B1F) — Diperbarui sinkron dengan CSS 2.4s
    const matLedSignal = new MeshBasicMaterial({ color: 0xff5b1f });

    // ======================================================================
    // 1. BACKGROUND 3D: Jejak Sirkuit Tipis di Bidang Belakang (Parallax)
    // ======================================================================
    const traceGroup = new Group();
    traceGroup.position.z = -1.35;

    const traceCoords = [
        // Jalur horizontal & diagonal 45 derajat khas PCB
        -3.2,  1.4, 0,  -1.2,  1.4, 0,  -1.2,  1.4, 0,  -0.6,  0.8, 0,  -0.6,  0.8, 0,   2.8,  0.8, 0,
        -3.0,  0.5, 0,  -1.6,  0.5, 0,  -1.6,  0.5, 0,  -1.1,  0.0, 0,  -1.1,  0.0, 0,   3.1,  0.0, 0,
        -2.9, -0.9, 0,  -0.8, -0.9, 0,  -0.8, -0.9, 0,  -0.3, -0.4, 0,  -0.3, -0.4, 0,   2.6, -0.4, 0,
        -2.5, -1.5, 0,   0.9, -1.5, 0,   0.9, -1.5, 0,   1.4, -1.0, 0,   1.4, -1.0, 0,   3.2, -1.0, 0,
        // Jalur vertikal penghubung bus
        -2.1,  1.8, 0,  -2.1, -1.8, 0,
         1.8,  1.8, 0,   1.8, -1.8, 0,
         0.4,  1.7, 0,   0.4,  0.8, 0,
        -0.3, -0.4, 0,  -0.3, -1.7, 0
    ];

    const traceGeo = new BufferGeometry();
    traceGeo.setAttribute('position', new Float32BufferAttribute(traceCoords, 3));
    const traceLines = new LineSegments(traceGeo, matTraceBg);
    traceGroup.add(traceLines);
    scene.add(traceGroup);

    // ======================================================================
    // 2. OBJEK UTAMA: Papan Mikrokontroler (PCB, Chip, Pin Header, 1 LED)
    // ======================================================================
    const boardGroup = new Group();
    // Sudut istirahat isometrik agar komponen 3D jelas terlihat
    const REST_ROT_X = 0.34;
    const REST_ROT_Y = -0.42;
    boardGroup.rotation.set(REST_ROT_X, REST_ROT_Y, 0.04);
    scene.add(boardGroup);

    // Papan Dasar PCB (3.4 x 2.3 x 0.12)
    const pcbMesh = new Mesh(new BoxGeometry(3.4, 2.3, 0.12), matPcbBody);
    boardGroup.add(pcbMesh);

    // Garis Silkscreen & Jejak di Atas Permukaan PCB
    const silkCoords = [
        -1.58,  1.04, 0.065,   1.58,  1.04, 0.065,
         1.58,  1.04, 0.065,   1.58, -1.04, 0.065,
         1.58, -1.04, 0.065,  -1.58, -1.04, 0.065,
        -1.58, -1.04, 0.065,  -1.58,  1.04, 0.065,
        // Jejak antar-chip di atas PCB
        -0.10,  0.20, 0.065,   0.45,  0.20, 0.065,
        -0.10,  0.00, 0.065,   0.45,  0.00, 0.065,
        -0.10, -0.20, 0.065,   0.45, -0.20, 0.065,
         0.95,  0.00, 0.065,   1.32,  0.00, 0.065
    ];
    const silkGeo = new BufferGeometry();
    silkGeo.setAttribute('position', new Float32BufferAttribute(silkCoords, 3));
    boardGroup.add(new LineSegments(silkGeo, matSilkscreen));

    // 4 Standoff Sudut PCB
    const standoffGeo = new CylinderGeometry(0.08, 0.08, 0.16, 12);
    standoffGeo.rotateX(Math.PI / 2);
    const holeOffsets = [
        [-1.42,  0.88],
        [ 1.42,  0.88],
        [-1.42, -0.88],
        [ 1.42, -0.88]
    ];
    holeOffsets.forEach(([hx, hy]) => {
        const ring = new Mesh(standoffGeo, matShield);
        ring.position.set(hx, hy, 0);
        boardGroup.add(ring);
    });

    // Chip 1: Mikrokontroler Utama ATmega328P + Kaki Pin IC
    const mcuMesh = new Mesh(new BoxGeometry(0.95, 0.72, 0.14), matChipBody);
    mcuMesh.position.set(-0.55, 0.0, 0.12);
    boardGroup.add(mcuMesh);

    const icLegGeo = new BoxGeometry(0.04, 0.86, 0.06);
    for (let i = -3; i <= 3; i++) {
        const leg = new Mesh(icLegGeo, matPinMetal);
        leg.position.set(-0.55 + i * 0.12, 0.0, 0.09);
        boardGroup.add(leg);
    }

    // Chip 2: Modul Wi-Fi ESP8266 (RF Shield Metalik)
    const wifiShield = new Mesh(new BoxGeometry(0.76, 0.88, 0.16), matShield);
    wifiShield.position.set(0.65, 0.0, 0.13);
    boardGroup.add(wifiShield);

    // Konektor USB di Sisi Kiri Papan
    const usbPort = new Mesh(new BoxGeometry(0.48, 0.56, 0.28), matShield);
    usbPort.position.set(-1.58, 0.0, 0.18);
    boardGroup.add(usbPort);

    // Deretan Pin Header (Atas & Bawah, masing-masing 14 Pin)
    const headerBarGeo = new BoxGeometry(2.3, 0.16, 0.20);
    const topHeader = new Mesh(headerBarGeo, matHeaderPlastic);
    topHeader.position.set(0.0, 0.88, 0.16);
    boardGroup.add(topHeader);

    const botHeader = new Mesh(headerBarGeo, matHeaderPlastic);
    botHeader.position.set(0.0, -0.88, 0.16);
    boardGroup.add(botHeader);

    const pinGeo = new BoxGeometry(0.04, 0.04, 0.30);
    for (let i = 0; i < 14; i++) {
        const px = -1.04 + i * 0.16;
        const pinTop = new Mesh(pinGeo, matPinMetal);
        pinTop.position.set(px, 0.88, 0.16);
        boardGroup.add(pinTop);

        const pinBot = new Mesh(pinGeo, matPinMetal);
        pinBot.position.set(px, -0.88, 0.16);
        boardGroup.add(pinBot);
    }

    // Satu Indikator LED Sinyal (#FF5B1F) di Kanan Papan
    const ledBase = new Mesh(new BoxGeometry(0.16, 0.16, 0.06), matHeaderPlastic);
    ledBase.position.set(1.32, 0.0, 0.09);
    boardGroup.add(ledBase);

    const ledDome = new Mesh(new CylinderGeometry(0.065, 0.065, 0.12, 14), matLedSignal);
    ledDome.rotation.x = Math.PI / 2;
    ledDome.position.set(1.32, 0.0, 0.15);
    boardGroup.add(ledDome);

    // ======================================================================
    // 3. INTERAKSI POINTER CUSTOM (Inersia, Drag Berbatas Sudut, Kembali Pelan)
    // ======================================================================
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;

    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let pointerNormX = 0;
    let pointerNormY = 0;

    const MAX_ROT_X = 0.52;
    const MAX_ROT_Y = 0.72;

    canvas.addEventListener('pointerdown', (e) => {
        isDragging = true;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
        if (canvas.setPointerCapture) {
            try { canvas.setPointerCapture(e.pointerId); } catch {}
        }
    });

    window.addEventListener(
        'pointermove',
        (e) => {
            const rect = stage.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                pointerNormX = MathUtils.clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
                pointerNormY = MathUtils.clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
            }

            if (!isDragging) return;
            const dx = e.clientX - prevPointerX;
            const dy = e.clientY - prevPointerY;
            prevPointerX = e.clientX;
            prevPointerY = e.clientY;

            dragOffsetY = MathUtils.clamp(dragOffsetY + dx * 0.007, -MAX_ROT_Y, MAX_ROT_Y);
            dragOffsetX = MathUtils.clamp(dragOffsetX + dy * 0.007, -MAX_ROT_X, MAX_ROT_X);
        },
        { passive: true }
    );

    function endDrag() {
        isDragging = false;
    }

    window.addEventListener('pointerup', endDrag, { passive: true });
    window.addEventListener('pointercancel', endDrag, { passive: true });

    // ======================================================================
    // 4. SINKRONISASI LED & PENGHENTIAN LOOP SAAT OFFSCREEN / TAB TIDAK AKTIF
    // ======================================================================
    let rafId = null;
    let isHeroVisible = true;
    const LED_PERIOD_MS = 2400; // Sama persis dengan --led-period: 2.4s di CSS

    function renderFrame(now) {
        rafId = null;

        // Saat tidak di-drag, kembali pelan ke posisi awal
        if (!isDragging) {
            dragOffsetX *= 0.94;
            dragOffsetY *= 0.94;
        }

        const targetRotX = REST_ROT_X + dragOffsetX + pointerNormY * 0.12;
        const targetRotY = REST_ROT_Y + dragOffsetY + pointerNormX * 0.16;

        boardGroup.rotation.x += (targetRotX - boardGroup.rotation.x) * 0.08;
        boardGroup.rotation.y += (targetRotY - boardGroup.rotation.y) * 0.08;

        // Parallax halus pada jejak sirkuit belakang
        traceGroup.position.x += (-pointerNormX * 0.18 - traceGroup.position.x) * 0.06;
        traceGroup.position.y += (pointerNormY * 0.14 - traceGroup.position.y) * 0.06;

        // Kedip LED #FF5B1F (R=255, G=91, B=31) <-> Redup (#5C2714) sinkron 2.4s
        const wave = 0.5 + 0.5 * Math.cos((now % LED_PERIOD_MS) / LED_PERIOD_MS * Math.PI * 2);
        const r = MathUtils.lerp(0.36, 1.0, wave);
        const g = MathUtils.lerp(0.15, 0.357, wave);
        const b = MathUtils.lerp(0.08, 0.122, wave);
        matLedSignal.color.setRGB(r, g, b);

        renderer.render(scene, camera);

        if (isHeroVisible && !document.hidden) {
            rafId = window.requestAnimationFrame(renderFrame);
        }
    }

    function startLoop() {
        if (!rafId && isHeroVisible && !document.hidden) {
            rafId = window.requestAnimationFrame(renderFrame);
        }
    }

    function stopLoop() {
        if (rafId) {
            window.cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    // Render 1 frame awal sebelum menampilkan canvas via opacity
    renderFrame(performance.now());
    document.documentElement.classList.add('has-3d-ready');
    startLoop();

    // Utilitas Ekspor Poster WebP (< 30 KB) Langsung dari Scene yang Sama
    if (window.location.search.includes('export-poster=1')) {
        window.setTimeout(() => {
            const dataUrl = canvas.toDataURL('image/webp', 0.82);
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = 'iot-board-poster.webp';
            a.click();
        }, 400);
    }

    // Jeda loop saat hero tidak terlihat di layar
    if ('IntersectionObserver' in window && heroSection) {
        const heroObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    isHeroVisible = entry.isIntersecting;
                    if (isHeroVisible) startLoop();
                    else stopLoop();
                });
            },
            { threshold: 0.05 }
        );
        heroObserver.observe(heroSection);
    }

    // Jeda loop saat tab tidak aktif
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopLoop();
        else startLoop();
    });

    // Tangani kehilangan konteks WebGL dengan kembali ke poster statis
    canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        stopLoop();
        document.documentElement.classList.remove('has-3d-ready');
    });

    // Resize terukur sesuai rasio kanvas
    window.addEventListener(
        'resize',
        () => {
            const w = stage.clientWidth;
            const h = stage.clientHeight;
            if (w > 0 && h > 0) {
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h, false);
            }
        },
        { passive: true }
    );
}