import React, { useState, useCallback, useRef } from 'react';
import ParticleScene from './components/ParticleScene';
import HandTracker from './components/HandTracker';
import { ShapeType, HandGesture } from './types';
import { analyzeVibe } from './services/geminiService';

const App: React.FC = () => {
  const [currentShape, setCurrentShape] = useState<ShapeType>(ShapeType.HEART);
  const [color, setColor] = useState<string>('#ff0066');
  const [gesture, setGesture] = useState<HandGesture>({ isOpen: true, pinchDistance: 1, detected: false });
  const [isUIHidden, setIsUIHidden] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  const videoRefForSnapshot = useRef<HTMLVideoElement | null>(null);

  const handleGestureUpdate = useCallback((newGesture: HandGesture) => {
    setGesture(newGesture);
  }, []);

  const handleVideoRef = (videoEl: HTMLVideoElement) => {
    videoRefForSnapshot.current = videoEl;
  };

  const handleMagicColor = async () => {
    if (!videoRefForSnapshot.current) return;
    
    setAnalyzing(true);
    try {
      // Capture frame
      const canvas = document.createElement('canvas');
      canvas.width = videoRefForSnapshot.current.videoWidth;
      canvas.height = videoRefForSnapshot.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRefForSnapshot.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        
        // Call Gemini
        const result = await analyzeVibe(base64);
        setColor(result.color);
        
        // Find matching shape enum
        const shapeKey = Object.values(ShapeType).find(s => s.toLowerCase() === result.suggestedShape.toLowerCase());
        if (shapeKey) setCurrentShape(shapeKey);
      }
    } catch (e) {
      console.error("Magic color failed", e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="relative w-full h-full bg-black select-none font-sans">
      {/* 3D Layer */}
      <div className="absolute inset-0 z-0">
        <ParticleScene currentShape={currentShape} color={color} gesture={gesture} />
      </div>

      {/* Hand Tracker (Invisible/Small) */}
      <HandTracker onGestureUpdate={handleGestureUpdate} onVideoFrame={handleVideoRef} />

      {/* Fullscreen Toggle */}
      <button 
        onClick={() => setIsUIHidden(!isUIHidden)}
        className="absolute top-4 right-4 z-40 text-white/50 hover:text-white transition-colors p-2"
      >
        {isUIHidden ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="3" y1="21" x2="21" y2="3"></line></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
        )}
      </button>

      {/* Interaction Feedback */}
      {gesture.detected && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 text-white/80 text-sm font-light tracking-widest animate-pulse">
           HAND DETECTED • {Math.round(gesture.pinchDistance * 100)}% OPEN
        </div>
      )}

      {/* Main Controls */}
      <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 w-[90%] max-w-2xl bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-white/10 transition-all duration-500 ${isUIHidden ? 'translate-y-[200%] opacity-0' : 'translate-y-0 opacity-100'}`}>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Shape Selectors */}
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <label className="text-xs text-white/50 uppercase tracking-wider font-bold">Model</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(ShapeType).map((shape) => (
                <button
                  key={shape}
                  onClick={() => setCurrentShape(shape)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    currentShape === shape 
                    ? 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                    : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {shape}
                </button>
              ))}
            </div>
          </div>

          {/* Color & Magic */}
          <div className="flex flex-col gap-2 w-full md:w-auto">
             <label className="text-xs text-white/50 uppercase tracking-wider font-bold">Appearance</label>
             <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 rounded-full border-none cursor-pointer bg-transparent"
                />
                
                <button
                  onClick={handleMagicColor}
                  disabled={analyzing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {analyzing ? (
                    <span className="animate-spin">✨</span>
                  ) : (
                    <span>✨ Gemini Vibe</span>
                  )}
                </button>
             </div>
          </div>

        </div>
        
        <div className="mt-4 text-center text-xs text-white/40">
           Tip: Open your palm to scatter particles, close your fist to gather them.
        </div>
      </div>
    </div>
  );
};

export default App;