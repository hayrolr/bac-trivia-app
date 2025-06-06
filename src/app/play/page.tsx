// src/app/play/page.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import useUserStore from '@/lib/store/userStore';
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Image from 'next/image';
//import MindARExperience from '@/components/ar/MindARExperience'; // NEW: Import MindAR component
import dynamic from 'next/dynamic';
// Dynamically import MindARExperience with ssr: false
const MindARExperience = dynamic(() => import('@/components/ar/MindARExperience'), {
    ssr: false,
    loading: () => <p style={{textAlign: 'center', marginTop: '20px'}}>Loading AR Experience...</p>
});

// --- SVG ICONS ---
const UserCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
    </svg>
);
const XMarkIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
);
const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// Helper to extract Totem ID for .mind file mapping
// e.g., "TOTEM01_Ahorro_INFO" -> "TOTEM01"
const getTotemIdentifierFromQR = (qrData: string): string | null => {
    if (!qrData) return null;
    const parts = qrData.split('_');
    if (parts.length > 0 && parts[0].toUpperCase().startsWith("TOTEM")) {
        return parts[0].toUpperCase(); // Returns "TOTEM01", "TOTEM02", etc.
    }
    return null; // Or a default identifier if pattern doesn't match
};


function PlayPageContent() {
    const router = useRouter();
    const user = useUserStore((state) => state);

    const [scannedData, setScannedData] = useState<string | null>(null);
    const [isValidQr, setIsValidQr] = useState<boolean | null>(null);
    const [showQrResultScreen, setShowQrResultScreen] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    const [shouldRenderScanner, setShouldRenderScanner] = useState(false);
    const [mindARImageTarget, setMindARImageTarget] = useState<string | null>(null); // Path to .mind file

    const qrcodeRegionId = "bac-qr-scanner-region";
    const html5QrCodeScannerRef = useRef<Html5QrcodeScanner | null>(null);

    // QR Code validation logic (remains the same)
    const validateQrData = (data: string): boolean => { //
        if (!data) return false;
        const pattern = /^TOTEM(0[1-4])_(Ahorro|Tarjeta|Casa|Carro)_INFO$/;
        const match = data.match(pattern);
        if (!match) return false;
        const numberStr = match[1];
        const categoryStr = match[2];
        const categoryMap: Record<string, string> = { "01": "Ahorro", "02": "Tarjeta", "03": "Casa", "04": "Carro" };
        return categoryMap[numberStr] === categoryStr;
    };

    const stopScanner = useCallback(() => { //
        if (html5QrCodeScannerRef.current) {
            try {
                html5QrCodeScannerRef.current.clear().catch(err => console.warn("PlayPage: Warn clear scanner:", err));
            } catch (e) { console.warn("PlayPage: Ex clear scanner:", e); }
            html5QrCodeScannerRef.current = null;
        }
    }, []);

    const resetToScanInitialScreen = useCallback(() => { //
        stopScanner();
        setScannedData(null);
        setShowQrResultScreen(false);
        setIsValidQr(null);
        setMindARImageTarget(null); // Stop AR by clearing the target
        setGeneralError(null);
        setShouldRenderScanner(false);
    }, [stopScanner]);

    // Setup QR Scanner Effect
    useEffect(() => { //
        if (shouldRenderScanner && !html5QrCodeScannerRef.current) {
            const scannerRegionElement = document.getElementById(qrcodeRegionId);
            if (!scannerRegionElement) {
                console.error("PlayPage: QR scanner div not found.");
                setGeneralError("Error al preparar escáner. Intente de nuevo.");
                setShouldRenderScanner(false);
                return;
            }
            try {
                const scanner = new Html5QrcodeScanner(qrcodeRegionId, {
                    fps: 10,
                    qrbox: (w,h) => ({width:Math.min(w,h)*0.7,height:Math.min(w,h)*0.7}),
                    rememberLastUsedCamera: true,
                    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                }, false);

                scanner.render(
                    (decodedText) => {
                        console.log("PlayPage: QR Escaneado:", decodedText);
                        stopScanner();
                        setShouldRenderScanner(false); // Hide scanner after successful scan
                        setGeneralError(null);
                        const isValid = validateQrData(decodedText);
                        setScannedData(decodedText);
                        setIsValidQr(isValid);
                        setShowQrResultScreen(true); // Show result screen (valid/invalid QR)
                    },
                    (errorMessage) => { console.warn("QR Scan error:", errorMessage); }
                );
                html5QrCodeScannerRef.current = scanner;
            } catch (error: any) {
                setGeneralError(`Error del escáner QR: ${error.message || String(error)}`);
                setShouldRenderScanner(false);
            }
        }
    }, [shouldRenderScanner, stopScanner]);

    // General cleanup effect
    useEffect(() => { //
        return () => {
            stopScanner();
            // MindAR cleanup is handled within MindARExperience component's own useEffect
            if (mindARImageTarget) { // If AR was active, reset it explicitly
                setMindARImageTarget(null); // This will trigger MindARExperience cleanup if it's based on this prop
            }
        };
    }, [stopScanner, mindARImageTarget]);

    const handleScanButtonClick = () => { //
        resetToScanInitialScreen(); // Reset everything
        setShouldRenderScanner(true); // Then show scanner
    };

    const handleScanAnotherQrButton = () => { //
        resetToScanInitialScreen();
        setShouldRenderScanner(true);
    };

    const handleContinueAfterInvalidQr = () => { //
        resetToScanInitialScreen();
    };

    const handleEnterAR = () => { //
        if (!scannedData || !isValidQr) {
            setGeneralError("No se puede iniciar AR con un QR no válido.");
            return;
        }
        setGeneralError(null);
        const totemId = getTotemIdentifierFromQR(scannedData);
        if (!totemId) {
            setGeneralError("QR no contiene un identificador de tótem válido para AR.");
            setShowQrResultScreen(true); // Reshow QR result screen with error
            setIsValidQr(false); // Mark as invalid for UI consistency
            return;
        }
        // Construct path to .mind file based on totemId
        // Ensure your .mind files are named like 'TOTEM01.mind', 'TOTEM02.mind', etc.
        // and are in /public/mindar-targets/
        const targetPath = `/mindar-targets/${totemId}.mind`;
        console.log(`PlayPage: Setting MindAR target to: ${targetPath}`);

        setMindARImageTarget(targetPath); // This will trigger rendering of MindARExperience
        setShowQrResultScreen(false); // Hide QR result screen
        setShouldRenderScanner(false); // Ensure scanner is hidden
    };

    const handleExitAR = useCallback(() => {
        console.log("PlayPage: Exiting AR, resetting to initial scan screen.");
        // This function is passed to MindARExperience to call when it needs to signal an exit.
        // MindARExperience handles its internal stop() and cleanup.
        // This resets the state of PlayPageContent.
        resetToScanInitialScreen();
        // MindAR cleanup requires a reload for some browsers/setups to fully release camera etc.
        // Consider if this is needed for your users or if MindAR's internal stop() is sufficient.
        // window.location.reload(); // Uncomment if facing persistent camera/resource issues after exiting AR.
    }, [resetToScanInitialScreen]);


    if (!user.isAuthenticated || !user.firestoreId) { //
        // ... (loading/redirect logic as before)
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <p>Debes iniciar sesión para jugar.</p>
                <Button onClick={() => router.push('/login')} className="mt-4 bg-red-600 hover:bg-red-700 text-white">Ir a Login</Button>
            </div>
        );
    }

    // UI for "Exit AR" button - only shown when AR is active
    const ExitARButton = () => (
        <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 100 }}> {/* Ensure high z-index */}
            <Button
                onClick={handleExitAR}
                variant="secondary"
                size="sm"
                className="bg-white/80 hover:bg-white text-red-600 border-red-300 hover:border-red-500 flex items-center shadow-lg px-3 py-1.5"
            >
                <XMarkIcon className="h-5 w-5 mr-1.5" /> Salir de AR
            </Button>
        </div>
    );

    // TopRightButton to go to Profile (remains similar)
    const TopRightProfileButton = () => { //
        // Show if not in scanning state and not in AR mode
        if (shouldRenderScanner || mindARImageTarget) return null;
        return (
            <Button onClick={() => router.push('/profile')} variant="secondary" size="sm" className="!absolute top-4 right-4 z-20 flex items-center bg-white/90 hover:bg-white shadow-md px-3 py-1.5" aria-label="Ir al perfil">
                <UserCircleIcon className="h-5 w-5 mr-1.5 text-gray-700" /><span className="text-gray-700">Perfil</span>
            </Button>
        );
    };


    // Render MindAR experience if a target is set
    if (mindARImageTarget && scannedData) {
        return (
            <div className="w-screen h-screen relative"> {/* Ensure MindAR can take full screen */}
                <MindARExperience
                    imageTargetSrc={mindARImageTarget}
                    qrCodeDataForNav={scannedData}
                    onARExit={handleExitAR}
                />
                <ExitARButton />
            </div>
        );
    }

    // Render QR result screen (valid or invalid QR)
    if (showQrResultScreen) { //
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-100 relative">
                <TopRightProfileButton />
                {isValidQr && scannedData ? (
                    <div className="mb-6 p-6 bg-white rounded-lg shadow-xl w-full max-w-md">
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-xl font-semibold mb-2 text-gray-800">¡QR Válido Escaneado!</p>
                        <p className="text-gray-600 my-4">¿Listo para la Realidad Aumentada?</p>
                        <Button onClick={handleEnterAR} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md text-lg mb-3">
                            Iniciar Experiencia AR
                        </Button>
                        <Button onClick={handleScanAnotherQrButton} variant="secondary" className="w-full py-2.5">
                            Escanear Otro QR
                        </Button>
                    </div>
                ) : (
                    <div className="mb-6 p-6 bg-white rounded-lg shadow-xl w-full max-w-md">
                        <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <p className="text-xl font-semibold text-red-700 mb-3">{generalError || "¡QR no válido!"}</p>
                        <p className="text-gray-600 mb-6 px-2">
                            El código QR escaneado no es reconocido. Por favor, intenta con un QR de tótem oficial BAC Trivia.
                        </p>
                        <Button onClick={handleContinueAfterInvalidQr} className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow-md text-lg">
                            Continuar
                        </Button>
                    </div>
                )}
                {generalError && !isValidQr && <p className="mt-4 text-red-500 p-3 bg-red-50 rounded-md">{generalError}</p>}
            </div>
        );
    }

    // Render initial screen or QR scanner
    return ( //
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-100 relative">
            <TopRightProfileButton />
            <div className="mb-8"> <Image src="/logos/bactrivia_logo.svg" alt="BAC Trivia Logo" width={140} height={40} priority /> </div>
            <h1 className="text-2xl font-semibold text-gray-700 mb-4">¡A Jugar!</h1>
            {!shouldRenderScanner && (
                <>
                    <p className="text-gray-600 mb-6 max-w-xs">Presiona Escanear QR y apunta tu cámara al código del tótem.</p>
                    <Button onClick={handleScanButtonClick} className="mb-4 bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-3" size="lg">Escanear QR</Button>
                </>
            )}
            {shouldRenderScanner && (
                <div id={qrcodeRegionId} className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto border-2 border-red-300 rounded-lg overflow-hidden shadow-lg my-4 p-1 bg-white"></div>
            )}
            {generalError && <p className="mt-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md w-full max-w-md">{generalError}</p>}
        </div>
    );
}

export default function PlayPageContainer() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Cargando página de juego...</p></div>}>
            <ProtectedRoute>
                <PlayPageContent />
            </ProtectedRoute>
        </Suspense>
    );
}