// src/components/ar/MindARExperience.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';

const getCategorySvgPathFromQR = (qrData: string): string => {
    if (!qrData) return '/icons/default.svg';
    const parts = qrData.toLowerCase().split('_');
    if (parts.length >= 2) {
        const categoryPart = parts[1];
        return `/icons/${categoryPart}.svg`;
    }
    return '/icons/default.svg';
};

interface MindARExperienceProps {
    imageTargetSrc: string | null;
    qrCodeDataForNav: string | null;
    onARExit: () => void;
}

const MindARExperience: React.FC<MindARExperienceProps> = ({ imageTargetSrc, qrCodeDataForNav, onARExit }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mindarInstanceRef = useRef<MindARThree | null>(null);
    const interactivePlaneRef = useRef<THREE.Mesh | null>(null);
    const [engineHasStarted, setEngineHasStarted] = useState(false);
    const engineHasStartedRef = useRef(engineHasStarted);
    useEffect(() => { engineHasStartedRef.current = engineHasStarted }, [engineHasStarted]);

    const router = useRouter();

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !imageTargetSrc || !qrCodeDataForNav) {
            onARExit();
            return;
        }

        let isEffectRunActive = true;
        let effectScopedMindAR: MindARThree | null = null;
        let clickHandler: ((e: Event) => void) | null = null;
        let associatedRendererDomElement: HTMLElement | null = null;

        // Remove any leftover UI from previous runs
        const cleanMindARUI = () => {
            document.querySelectorAll('.mindar-ui-overlay, .mindar-ui-scanning, .mindar-ui-loading, .mindar-ui-error')
                .forEach(el => el.remove());
        };

        const handleResize = (renderer: THREE.WebGLRenderer, camera: THREE.Camera) => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            renderer.setSize(width, height);
            if ('aspect' in camera) {
                (camera as THREE.PerspectiveCamera).aspect = width / height;
                (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
            }
        };

        const initializeMindAR = async () => {
            try {
                effectScopedMindAR = new MindARThree({
                    container,
                    imageTargetSrc,
                    maxTrack: 1,
                    uiLoading: "yes",
                    uiScanning: "yes",
                    uiError: "yes",
                });

                const { renderer, scene, camera } = effectScopedMindAR;
                associatedRendererDomElement = renderer.domElement;

                // Set canvas renderer to full screen based on actual device pixels
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(window.devicePixelRatio);

                // Adjust camera projection
                if ('aspect' in camera) {
                    const cam = camera as THREE.PerspectiveCamera;
                    cam.aspect = window.innerWidth / window.innerHeight;
                    cam.updateProjectionMatrix();
                }

                // Force renderer DOM styles to cover screen exactly
                if (associatedRendererDomElement) {
                    Object.assign(associatedRendererDomElement.style, {
                        position: 'fixed',
                        top: '0px',
                        left: '0px',
                        width: `${window.innerWidth}px`,
                        height: `${window.innerHeight}px`,
                        objectFit: 'cover',
                        pointerEvents: 'auto',
                        zIndex: '10'
                    });
                }

                // Force .mindar-container (internal wrapper) to also cover full screen
                const mindarContainer = container.querySelector('.mindar-container') as HTMLElement;
                if (mindarContainer) {
                    Object.assign(mindarContainer.style, {
                        position: 'fixed',
                        top: '0px',
                        left: '0px',
                        width: `${window.innerWidth}px`,
                        height: `${window.innerHeight}px`,
                        zIndex: '9',
                        backgroundColor: 'black'
                    });
                }

                // // Apply proper styles to renderer canvas
                // if (associatedRendererDomElement) {
                //     associatedRendererDomElement.style.position = 'absolute';
                //     associatedRendererDomElement.style.top = '0px';
                //     associatedRendererDomElement.style.left = '0px';
                //     associatedRendererDomElement.style.width = '100vw';
                //     associatedRendererDomElement.style.height = '100vh';
                //     associatedRendererDomElement.style.objectFit = 'cover';
                //     associatedRendererDomElement.style.zIndex = '10';
                //     associatedRendererDomElement.style.pointerEvents = 'auto';
                // }

                // Handle resize
                handleResize(renderer, camera);
                const resizeHandler = () => handleResize(renderer, camera);
                window.addEventListener('resize', resizeHandler);

                // Setup texture and plane
                const svgPath = getCategorySvgPathFromQR(qrCodeDataForNav);
                const texture = new THREE.TextureLoader().load(svgPath);
                const plane = new THREE.Mesh(
                    new THREE.PlaneGeometry(1, 1),
                    new THREE.MeshBasicMaterial({
                        map: texture,
                        transparent: true,
                        side: THREE.DoubleSide,
                        depthTest: false
                    })
                );
                plane.userData = { qrCodeData: qrCodeDataForNav, isInteractive: true };
                plane.position.set(0, 0, 0.01);
                plane.visible = false;
                interactivePlaneRef.current = plane;

                const anchor = effectScopedMindAR.addAnchor(0);
                anchor.group.add(plane);
                anchor.onTargetFound = () => { if (isEffectRunActive) plane.visible = true; };
                anchor.onTargetLost = () => { if (isEffectRunActive) plane.visible = false; };

                // Setup click handler
                clickHandler = (event: Event) => {
                    const canvas = associatedRendererDomElement;
                    const localPlane = interactivePlaneRef.current;
                    if (!canvas || !localPlane || !localPlane.visible || !engineHasStartedRef.current || !isEffectRunActive) return;

                    const pointer = new THREE.Vector2();
                    let x = 0, y = 0;
                    if (event instanceof MouseEvent) {
                        x = event.clientX;
                        y = event.clientY;
                    } else if (event instanceof TouchEvent && event.touches.length > 0) {
                        x = event.touches[0].clientX;
                        y = event.touches[0].clientY;
                    } else {
                        return;
                    }

                    pointer.x = (x / canvas.clientWidth) * 2 - 1;
                    pointer.y = -(y / canvas.clientHeight) * 2 + 1;

                    const raycaster = new THREE.Raycaster();
                    raycaster.setFromCamera(pointer, camera);
                    const intersects = raycaster.intersectObjects([localPlane]);

                    if (intersects.length > 0 && intersects[0].object.userData.isInteractive) {
                        const { qrCodeData } = intersects[0].object.userData;

                        isEffectRunActive = false;
                        try {
                            effectScopedMindAR?.stop();
                            renderer.setAnimationLoop(null);
                            mindarInstanceRef.current = null;
                            setEngineHasStarted(false);
                        } catch (e) {
                            console.warn("MindAR: Error stopping after click", e);
                        }

                        router.push(`/trivia?qrCodeData=${encodeURIComponent(qrCodeData)}`);
                    }
                };

                if (associatedRendererDomElement && clickHandler) {
                    associatedRendererDomElement.addEventListener('click', clickHandler);
                }

                await effectScopedMindAR.start();

                // start new
                // Wait for MindAR to inject the video and canvas wrappers
                setTimeout(() => {
                    // Force internal .mindar-container to full screen
                    const mindarContainer = container.querySelector('.mindar-container') as HTMLElement;
                    if (mindarContainer) {
                        mindarContainer.style.position = 'fixed';
                        mindarContainer.style.top = '0';
                        mindarContainer.style.left = '0';
                        mindarContainer.style.width = `${window.innerWidth}px`;
                        mindarContainer.style.height = `${window.innerHeight}px`;
                        mindarContainer.style.zIndex = '5';
                        mindarContainer.style.display = 'block';
                        mindarContainer.style.background = 'transparent';
                    }

                    // Force canvas size again after video is initialized
                    if (associatedRendererDomElement) {
                        associatedRendererDomElement.style.width = `${window.innerWidth}px`;
                        associatedRendererDomElement.style.height = `${window.innerHeight}px`;
                    }

                    // Force video size if available
                    const videoEl = container.querySelector('video') as HTMLVideoElement;
                    if (videoEl) {
                        videoEl.style.position = 'fixed';
                        videoEl.style.top = '0';
                        videoEl.style.left = '0';
                        videoEl.style.width = `${window.innerWidth}px`;
                        videoEl.style.height = `${window.innerHeight}px`;
                        videoEl.style.objectFit = 'cover';
                        videoEl.style.zIndex = '1';
                        videoEl.setAttribute('playsinline', 'true');
                    }
                }, 300); // delay ensures DOM is ready
                // end new

                if (!isEffectRunActive) {
                    await effectScopedMindAR.stop();
                    return;
                }

                mindarInstanceRef.current = effectScopedMindAR;
                renderer.setAnimationLoop(() => renderer.render(scene, camera));
                setEngineHasStarted(true);
            } catch (err) {
                console.error("MindAR: Failed to initialize", err);
                onARExit();
            }
        };

        cleanMindARUI();
        initializeMindAR();

        return () => {
            isEffectRunActive = false;

            // Remove click handler
            if (associatedRendererDomElement && clickHandler) {
                associatedRendererDomElement.removeEventListener('click', clickHandler);
            }

            // Stop MindAR if running
            if (mindarInstanceRef.current) {
                try {
                    mindarInstanceRef.current.stop();
                    mindarInstanceRef.current.renderer.setAnimationLoop(null);
                } catch (e) {
                    console.warn("MindAR: Cleanup stop error", e);
                }
                mindarInstanceRef.current = null;
            }

            setEngineHasStarted(false);

            // Remove leftover UI overlays
            cleanMindARUI();

            // Clear container
            if (container) {
                while (container.firstChild) container.removeChild(container.firstChild);
            }

            // Remove resize handler
            window.removeEventListener('resize', handleResize as any);
        };
    }, [imageTargetSrc, qrCodeDataForNav, router, onARExit]);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 10,
                overflow: 'hidden',
                backgroundColor: 'black'
            }}
        />
    );
};

export default MindARExperience;