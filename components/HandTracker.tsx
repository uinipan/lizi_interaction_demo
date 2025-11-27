import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { HandGesture } from '../types';

interface HandTrackerProps {
  onGestureUpdate: (gesture: HandGesture) => void;
  onVideoFrame?: (video: HTMLVideoElement) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onGestureUpdate, onVideoFrame }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        setLoaded(true);
        startCamera();
      } catch (err) {
        console.error("Failed to load MediaPipe", err);
      }
    };
    init();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener("loadeddata", predictWebcam);
        if (onVideoFrame) onVideoFrame(videoRef.current);
      }
    }
  };

  const predictWebcam = () => {
    if (!handLandmarkerRef.current || !videoRef.current) return;
    
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      requestRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    const startTimeMs = performance.now();
    const result = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

    let gesture: HandGesture = {
      isOpen: true,
      pinchDistance: 1,
      detected: false
    };

    if (result.landmarks && result.landmarks.length > 0) {
      const landmarks = result.landmarks[0];
      // Index finger tip (8) and Thumb tip (4)
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      
      const distance = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) + 
        Math.pow(thumbTip.y - indexTip.y, 2)
      );

      // Adjusted Sensitivity
      // 0.02 is touching (Fist/Pinch)
      // 0.12 is Open (Reduced from 0.15 to make it easier to fully scatter)
      const normalized = Math.min(Math.max((distance - 0.02) / 0.12, 0), 1);
      
      gesture = {
        detected: true,
        isOpen: normalized > 0.5,
        pinchDistance: normalized
      };
    }

    onGestureUpdate(gesture);
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="absolute bottom-4 left-4 z-50 opacity-80 pointer-events-none">
      <div className="relative rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
        <video 
          ref={videoRef} 
          className={`w-32 h-24 object-cover transform -scale-x-100 ${loaded ? 'block' : 'hidden'}`}
          autoPlay 
          playsInline
          muted
        />
        {!loaded && <div className="w-32 h-24 bg-gray-900 flex items-center justify-center text-xs text-white">Loading Vision...</div>}
        <div className="absolute top-1 right-1">
          <div className={`w-2 h-2 rounded-full animate-pulse ${loaded ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
      </div>
    </div>
  );
};

export default HandTracker;