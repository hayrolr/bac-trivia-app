// src/types/mind-ar.d.ts

declare module 'mind-ar/dist/mindar-image-three.prod.js' {
    // We can leave this empty to just suppress the error and treat it as 'any':
    // const MindARThree: any;
    // export { MindARThree };

    // Or, for better (but still basic) typing, you can define the MindARThree class
    // with the methods and properties you know you'll be using.
    // This requires looking at MindAR's documentation or source to see its structure.
    // For a start, you can define it with the constructor and methods used in your code:
    export class MindARThree {
        constructor(options: {
            container: HTMLElement;
            imageTargetSrc: string;
            maxTrack?: number;
            uiLoading?: string;
            uiScanning?: string;
            uiError?: string;
            filterMinCF?: number;
            filterBeta?: number;
            missTolerance?: number;
            warmupTolerance?: number;
        });

        renderer: THREE.WebGLRenderer;
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        anchors: Array<{
            group: THREE.Group;
            onTargetFound?: () => void;
            onTargetLost?: () => void;
            targetIndex: number;
            visible: boolean;
        }>;

        addAnchor(targetIndex: number): {
            group: THREE.Group; // This is the group you add your 3D objects to
            targetIndex: number;
            visible: boolean;
            onTargetFound?: () => void;
            onTargetLost?: () => void;
        };

        start(): Promise<void>;
        stop(): void;
    }
}

// If you also use the non-production version for debugging, you might add:
declare module 'mind-ar/dist/mindar-image-three.js' {
    export class MindARThree {
        constructor(options: {
            container: HTMLElement;
            imageTargetSrc: string;
            maxTrack?: number;
            uiLoading?: string;
            uiScanning?: string;
            uiError?: string;
            filterMinCF?: number;
            filterBeta?: number;
            missTolerance?: number;
            warmupTolerance?: number;
        });

        renderer: THREE.WebGLRenderer;
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        anchors: Array<{
            group: THREE.Group;
            onTargetFound?: () => void;
            onTargetLost?: () => void;
            targetIndex: number;
            visible: boolean;
        }>;

        addAnchor(targetIndex: number): {
            group: THREE.Group;
            targetIndex: number;
            visible: boolean;
            onTargetFound?: () => void;
            onTargetLost?: () => void;
        };

        start(): Promise<void>;
        stop(): void;
    }
}