"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Sliders, Info, Wheat, Flame, Clock, Package } from "lucide-react";

const TOTAL_FRAMES = 240;

interface ProcessStep {
  title: string;
  subtitle: string;
  description: string;
  frameRange: [number, number];
  icon: React.ReactNode;
}

export function BreadProcess() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const [frameIndex, setFrameIndex] = useState(1);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [preloadStarted, setPreloadStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Interactive / Hover states
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [scrubMode, setScrubMode] = useState<"scroll" | "hover">("scroll");

  // Mobile check state (safe for Next.js SSR hydration)
  const [isMobile, setIsMobile] = useState(false);

  const steps: ProcessStep[] = [
    {
      title: "Chakki Kneading",
      subtitle: "Fresh Sourdough & 100% Whole Wheat",
      description: "We blend chakki-fresh whole wheat flour with our active sourdough starter, kneading gently to build a strong gluten structure.",
      frameRange: [1, 60],
      icon: <Wheat className="w-4 h-4" />
    },
    {
      title: "Natural Proofing",
      subtitle: "Slow 18-Hour Fermentation",
      description: "Patience is our secret ingredient. The dough rests in a controlled climate, rising naturally to unlock rich aromas and digestibility.",
      frameRange: [61, 120],
      icon: <Clock className="w-4 h-4" />
    },
    {
      title: "Deck-Oven Baking",
      subtitle: "Golden Crust & Airy Crumb",
      description: "Baked on authentic stone deck ovens with steam injection, caramelizing the outer crust while locking moisture inside.",
      frameRange: [121, 180],
      icon: <Flame className="w-4 h-4" />
    },
    {
      title: "Cooling & Slicing",
      subtitle: "Breathable Packaging",
      description: "Loaves are cooled gradually, sliced with precision blades, and sealed in breathable bags to preserve day-one bakery freshness.",
      frameRange: [181, 240],
      icon: <Package className="w-4 h-4" />
    }
  ];

  // Detect Mobile Viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Preload images
  useEffect(() => {
    if (preloadStarted) return;
    setPreloadStarted(true);

    const loadImages = async () => {
      const loadPromises = [];

      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const frameNum = String(i).padStart(3, "0");
        const src = `/bread-process/ezgif-frame-${frameNum}.jpg`;

        const promise = new Promise<void>((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = () => {
            imagesRef.current[i] = img;
            setImagesLoaded((prev) => prev + 1);
            resolve();
          };
          img.onerror = () => {
            resolve();
          };
        });
        loadPromises.push(promise);
      }

      await Promise.all(loadPromises);
    };

    loadImages();
  }, [preloadStarted]);

  // Handle Scroll Progress (Only active on Desktop)
  useEffect(() => {
    const handleScroll = () => {
      if (isMobile) return; // Skip on mobile
      if (!containerRef.current || scrubMode !== "scroll" || isPlaying) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scrollTop = -rect.top;
      const scrollHeight = rect.height - window.innerHeight;

      if (scrollHeight <= 0) return;

      const progress = Math.max(0, Math.min(1, scrollTop / scrollHeight));
      setScrollProgress(progress);

      const targetFrame = Math.floor(progress * (TOTAL_FRAMES - 1)) + 1;
      setFrameIndex(targetFrame);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [scrubMode, isPlaying, isMobile]);

  // Auto-play Animation loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    const fps = 24;
    const interval = 1000 / fps;

    const renderLoop = (time: number) => {
      if (!isPlaying) return;

      const delta = time - lastTime;
      if (delta >= interval) {
        setFrameIndex((prev) => {
          const next = prev + 1;
          if (next > TOTAL_FRAMES) {
            return 1; // loop
          }
          setScrollProgress(next / TOTAL_FRAMES);
          return next;
        });
        lastTime = time - (delta % interval);
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(renderLoop);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  // Draw current frame to Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    canvas.height = rect.height * (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);

    let activeImg = imagesRef.current[frameIndex];

    if (!activeImg || !activeImg.complete) {
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const prev = frameIndex - offset;
        const next = frameIndex + offset;

        if (prev >= 1 && imagesRef.current[prev]?.complete) {
          activeImg = imagesRef.current[prev];
          break;
        }
        if (next <= TOTAL_FRAMES && imagesRef.current[next]?.complete) {
          activeImg = imagesRef.current[next];
          break;
        }
      }
    }

    if (activeImg && activeImg.complete) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const imgRatio = activeImg.width / activeImg.height;
      const canvasRatio = canvas.width / canvas.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      } else {
        drawHeight = canvas.width / imgRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      }

      ctx.drawImage(activeImg, offsetX, offsetY, drawWidth, drawHeight);
    } else {
      ctx.fillStyle = "#151b0f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#E8C97A";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Loading Visuals...", canvas.width / 2, canvas.height / 2);
    }
  }, [frameIndex, imagesLoaded]);

  // Determine which step is currently active
  const activeStepIndex = steps.findIndex(
    (step) => frameIndex >= step.frameRange[0] && frameIndex <= step.frameRange[1]
  );
  
  const currentStep = steps[activeStepIndex !== -1 ? activeStepIndex : 0];

  // Mouse move handlers for 3D tilt & scanner overlay (Desktop only)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const tiltX = ((y / rect.height) - 0.5) * 8; 
    const tiltY = ((x / rect.width) - 0.5) * -8; 
    setTilt({ x: tiltX, y: tiltY });

    if (scrubMode === "hover" && !isPlaying) {
      const hoverProgress = Math.max(0, Math.min(1, x / rect.width));
      const targetFrame = Math.floor(hoverProgress * (TOTAL_FRAMES - 1)) + 1;
      setFrameIndex(targetFrame);
      setScrollProgress(hoverProgress);
    }
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    
    if (scrubMode === "hover" && containerRef.current && !isPlaying) {
      const rect = containerRef.current.getBoundingClientRect();
      const scrollTop = -rect.top;
      const scrollHeight = rect.height - window.innerHeight;
      if (scrollHeight > 0) {
        const progress = Math.max(0, Math.min(1, scrollTop / scrollHeight));
        setScrollProgress(progress);
        setFrameIndex(Math.floor(progress * (TOTAL_FRAMES - 1)) + 1);
      }
    }
  };

  // Smooth frame scrubbing animation when tapping buttons
  const animateToFrame = (targetFrame: number) => {
    setIsPlaying(false);
    const startFrame = frameIndex;
    const duration = 400; // 400ms transition
    const startTime = performance.now();

    const anim = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.floor(startFrame + (targetFrame - startFrame) * ease);
      
      setFrameIndex(current);
      setScrollProgress(current / TOTAL_FRAMES);

      if (progress < 1) {
        requestAnimationFrame(anim);
      }
    };

    requestAnimationFrame(anim);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setFrameIndex(val);
    setScrollProgress(val / TOTAL_FRAMES);
    if (isPlaying) setIsPlaying(false);
  };

  // Scroll to step on Desktop
  const scrollToStepDesktop = (stepIdx: number) => {
    if (!containerRef.current) return;
    const step = steps[stepIdx];
    const targetFrame = step.frameRange[0];
    
    setFrameIndex(targetFrame);
    setScrollProgress(targetFrame / TOTAL_FRAMES);

    const rect = containerRef.current.getBoundingClientRect();
    const absoluteTop = window.scrollY + rect.top;
    const scrollHeight = rect.height - window.innerHeight;
    const targetScrollY = absoluteTop + (targetFrame / TOTAL_FRAMES) * scrollHeight;

    window.scrollTo({
      top: targetScrollY,
      behavior: "smooth",
    });
  };

  const percentLoaded = Math.min(100, Math.floor((imagesLoaded / TOTAL_FRAMES) * 100));

  return (
    <section 
      ref={containerRef} 
      className={`relative w-full ${isMobile ? "py-12 px-4" : "min-h-[180vh]"}`} 
      style={{ backgroundColor: "#1e2617" }}
    >
      {/* Loading experience popup */}
      {percentLoaded < 100 && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-black/85 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-xs font-bold text-[#F0F5EA] shadow-xl">
          <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#E8C97A] transition-all duration-300" 
              style={{ width: `${percentLoaded}%` }}
            />
          </div>
          <span>Loading {percentLoaded}%</span>
        </div>
      )}

      {/* MOBILE INTERACTIVE LAYOUT */}
      {isMobile ? (
        <div className="max-w-xl mx-auto flex flex-col gap-6 relative z-10 text-center">
          
          {/* Header Title */}
          <div className="border-b border-[#F0F5EA]/10 pb-4">
            <span className="text-[#E8C97A] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8C97A] animate-pulse" />
              Artisanal Process
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold uppercase text-[#F0F5EA] tracking-wide mt-1">
              The Journey of Your Loaf
            </h2>
          </div>

          {/* Visual Canvas Block */}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#F0F5EA]/15 shadow-lg bg-[#151b0f]">
            <canvas ref={canvasRef} className="w-full h-full object-cover" />
            
            {/* Hud badge */}
            <div className="absolute top-3 left-3 bg-[#1e2617]/90 backdrop-blur-md border border-[#F0F5EA]/15 rounded-full px-3 py-1 text-[10px] font-mono tracking-widest text-[#F0F5EA]">
              STAGE 0{activeStepIndex + 1}
            </div>
          </div>

          {/* Simple controls bar */}
          <div className="bg-[#F0F5EA]/5 border border-[#F0F5EA]/10 rounded-xl p-3 flex items-center gap-3 justify-between">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-9 h-9 rounded-full bg-[#E8C97A] text-[#3A4A2E] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            {/* Slider */}
            <input 
              type="range"
              min={1}
              max={TOTAL_FRAMES}
              value={frameIndex}
              onChange={handleSliderChange}
              className="flex-grow h-1.5 bg-[#F0F5EA]/10 rounded-full appearance-none cursor-pointer accent-[#E8C97A]"
            />

            <button 
              onClick={() => {
                setIsPlaying(false);
                setFrameIndex(1);
                setScrollProgress(0);
              }}
              className="w-9 h-9 rounded-full bg-white/10 text-[#F0F5EA] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Step Selector Pills (Horizontal Row) */}
          <div className="grid grid-cols-4 gap-1 bg-[#F0F5EA]/3 border border-[#F0F5EA]/5 p-1 rounded-xl">
            {steps.map((step, idx) => {
              const isActive = idx === activeStepIndex;
              return (
                <button
                  key={step.title}
                  onClick={() => animateToFrame(step.frameRange[0])}
                  className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all duration-300 ${
                    isActive 
                      ? "bg-[#E8C97A] text-[#3A4A2E] shadow font-bold" 
                      : "text-[#F0F5EA]/60 hover:text-[#F0F5EA] hover:bg-white/5"
                  }`}
                >
                  <div className={isActive ? "text-[#3A4A2E]" : "text-[#E8C97A]"}>
                    {step.icon}
                  </div>
                  <span className="text-[9px] uppercase font-bold tracking-tighter block truncate max-w-full">
                    Stage 0{idx + 1}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Step Description Card */}
          <div className="bg-[#F0F5EA]/5 border border-[#F0F5EA]/10 rounded-2xl p-5 text-left transition-all duration-300">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8C97A] block mb-1">
              Active Stage Description
            </span>
            <h3 className="text-lg font-extrabold uppercase text-[#F0F5EA] tracking-wide mb-1">
              {currentStep.title}
            </h3>
            <p className="text-xs font-semibold text-[#E8C97A]/95 mb-3">
              {currentStep.subtitle}
            </p>
            <p className="text-xs text-[#F0F5EA]/80 leading-relaxed font-medium">
              {currentStep.description}
            </p>
          </div>

        </div>
      ) : (
        /* DESKTOP STICKY SCROLL LAYOUT */
        <div className="sticky top-[112px] h-[calc(100vh-112px)] w-full flex items-center justify-center overflow-hidden py-6">
          <div className="absolute inset-0 bg-radial-gradient from-[#3A4A2E]/30 to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto w-full px-8 h-full flex flex-col justify-between relative z-10">
            
            {/* Header Title */}
            <div className="flex justify-between items-center border-b border-[#F0F5EA]/10 pb-4">
              <div>
                <span className="text-[#E8C97A] font-bold text-xs uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8C97A] animate-pulse" />
                  Artisanal Process
                </span>
                <h2 className="text-4xl font-extrabold uppercase text-[#F0F5EA] tracking-wide mt-1">
                  The Journey of Your Loaf
                </h2>
              </div>

              {/* Interaction mode selectors */}
              <div className="flex items-center bg-[#F0F5EA]/5 border border-[#F0F5EA]/10 rounded-full p-1 text-xs">
                <button 
                  onClick={() => { setScrubMode("scroll"); setIsPlaying(false); }}
                  className={`px-4 py-1.5 rounded-full font-bold uppercase tracking-wider transition-all ${
                    scrubMode === "scroll" 
                      ? "bg-[#E8C97A] text-[#3A4A2E] shadow" 
                      : "text-[#F0F5EA]/70 hover:text-[#F0F5EA]"
                  }`}
                >
                  Scroll Control
                </button>
                <button 
                  onClick={() => { setScrubMode("hover"); setIsPlaying(false); }}
                  className={`px-4 py-1.5 rounded-full font-bold uppercase tracking-wider transition-all ${
                    scrubMode === "hover" 
                      ? "bg-[#E8C97A] text-[#3A4A2E] shadow" 
                      : "text-[#F0F5EA]/70 hover:text-[#F0F5EA]"
                  }`}
                >
                  Hover Scrub
                </button>
              </div>
            </div>

            {/* Main Visualizer & Steps Layout */}
            <div className="grid grid-cols-12 gap-8 my-auto items-center flex-grow py-4 h-0 min-h-0 w-full">
              
              {/* Visual Canvas Block (7/12) */}
              <div className="col-span-7 flex flex-col justify-center h-full min-h-0">
                
                <div 
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={handleMouseLeave}
                  onMouseMove={handleMouseMove}
                  className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden cursor-crosshair border border-[#F0F5EA]/15 shadow-[0_15px_40px_rgba(0,0,0,0.4)] group bg-[#151b0f] transition-shadow duration-500 hover:shadow-[0_20px_60px_rgba(232,201,122,0.1)]"
                  style={{
                    transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                    transition: isHovered ? "none" : "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
                  }}
                >
                  <canvas ref={canvasRef} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]" />

                  {/* Grid Overlay on Hover */}
                  {isHovered && (
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
                  )}

                  {/* Scanner Overlay Line */}
                  {isHovered && (
                    <div 
                      className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E8C97A]/50 to-transparent pointer-events-none animate-pulse"
                      style={{ top: `${mousePos.y}px` }}
                    />
                  )}

                  {/* Circular Sensor Magnifier */}
                  {isHovered && (
                    <div 
                      className="absolute w-24 h-24 rounded-full border border-[#E8C97A]/60 bg-white/5 backdrop-blur-xs pointer-events-none flex items-center justify-center -translate-x-12 -translate-y-12 shadow-[0_0_15px_rgba(232,201,122,0.2)]"
                      style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
                    >
                      <span className="text-[10px] font-mono tracking-widest text-[#E8C97A] uppercase bg-[#1e2617]/90 px-1.5 py-0.5 rounded border border-[#E8C97A]/20">
                        SCANNING
                      </span>
                    </div>
                  )}

                  {/* HUD Stage Badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#1e2617]/85 backdrop-blur-md border border-[#F0F5EA]/15 rounded-full px-3.5 py-1.5 text-xs font-mono tracking-widest text-[#F0F5EA] shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-[#E8C97A] animate-ping" />
                    STAGE 0{activeStepIndex + 1} // {currentStep.title.toUpperCase()}
                  </div>

                  {/* Hover Scrub Alert Overlay */}
                  {scrubMode === "hover" && !isHovered && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center gap-2 pointer-events-none transition-all duration-300">
                      <Sliders className="w-8 h-8 text-[#E8C97A] animate-bounce" />
                      <p className="text-sm font-bold text-[#F0F5EA] uppercase tracking-widest">
                        Hover & Move mouse horizontally
                      </p>
                      <p className="text-xs text-[#F0F5EA]/70">
                        to scrub through the bread process frames
                      </p>
                    </div>
                  )}

                </div>

                {/* Media Control Bar */}
                <div className="mt-4 bg-[#F0F5EA]/5 border border-[#F0F5EA]/10 rounded-2xl p-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-10 h-10 rounded-full bg-[#E8C97A] text-[#3A4A2E] flex items-center justify-center hover:scale-105 transition-transform shadow font-bold"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>
                    
                    <button 
                      onClick={() => {
                        setIsPlaying(false);
                        setFrameIndex(1);
                        setScrollProgress(0);
                      }}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-[#F0F5EA] flex items-center justify-center hover:scale-105 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Slider */}
                  <div className="flex-grow flex items-center gap-3">
                    <span className="text-[11px] font-mono text-[#F0F5EA]/50">F001</span>
                    <input 
                      type="range"
                      min={1}
                      max={TOTAL_FRAMES}
                      value={frameIndex}
                      onChange={handleSliderChange}
                      className="flex-grow h-1.5 bg-[#F0F5EA]/10 rounded-full appearance-none cursor-pointer accent-[#E8C97A]"
                    />
                    <span className="text-[11px] font-mono text-[#F0F5EA]/50">F{String(TOTAL_FRAMES).padStart(3, "0")}</span>
                  </div>

                  {/* Frame statistics indicators */}
                  <div className="flex items-center gap-3 border-l border-[#F0F5EA]/10 pl-4 text-xs font-mono text-[#F0F5EA]/70">
                    <div className="text-right">
                      <span className="block text-[10px] text-[#F0F5EA]/40 uppercase font-bold">Progress</span>
                      <span>{Math.round(scrollProgress * 100)}% ({frameIndex}/{TOTAL_FRAMES})</span>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center relative cursor-help group">
                      <Info className="w-4 h-4 text-[#E8C97A]" />
                      <div className="absolute bottom-10 right-0 w-48 bg-[#1e2617] border border-white/10 p-3 rounded-lg text-[10px] font-sans leading-relaxed text-[#F0F5EA] shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        {scrubMode === "scroll" 
                          ? "Currently in Scroll mode. Simply scroll the page up or down to scrub frames." 
                          : "Currently in Hover Scrub mode. Slide your cursor left-to-right over the image above."}
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Narrative steps list (5/12) */}
              <div className="col-span-5 h-full overflow-y-auto pr-2 flex flex-col min-h-0 no-scrollbar">
                <div className="flex flex-col gap-4 my-auto py-4">
                
                {steps.map((step, idx) => {
                  const isActive = idx === activeStepIndex;
                  
                  const rangeSize = step.frameRange[1] - step.frameRange[0];
                  const relativeFrame = frameIndex - step.frameRange[0];
                  const stepPercent = isActive 
                    ? Math.max(0, Math.min(100, (relativeFrame / rangeSize) * 100))
                    : frameIndex > step.frameRange[1] ? 100 : 0;

                  return (
                    <div 
                      key={step.title}
                      onClick={() => scrollToStepDesktop(idx)}
                      className={`group cursor-pointer rounded-2xl border p-4 transition-all duration-500 relative overflow-hidden flex gap-4 flex-shrink-0 ${
                        isActive 
                          ? "bg-[#F0F5EA]/10 border-[#E8C97A]/40 shadow-[0_4px_25px_rgba(232,201,122,0.05)]" 
                          : "bg-[#F0F5EA]/2 border-[#F0F5EA]/5 hover:bg-[#F0F5EA]/5 hover:border-[#F0F5EA]/10"
                      }`}
                    >
                      {/* Left border active progress fill */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/5 overflow-hidden">
                        <div 
                          className="w-full bg-[#E8C97A] transition-all duration-150 ease-out origin-top"
                          style={{ height: `${stepPercent}%` }}
                        />
                      </div>

                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                          isActive 
                            ? "bg-[#E8C97A] border-[#E8C97A] text-[#3A4A2E] scale-110 shadow-[0_0_15px_rgba(232,201,122,0.4)]" 
                            : "bg-white/5 border-white/10 text-[#F0F5EA]/60 group-hover:border-[#F0F5EA]/35 group-hover:text-[#F0F5EA]"
                        }`}>
                          {step.icon}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-grow space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${
                            isActive ? "text-[#E8C97A]" : "text-[#F0F5EA]/40"
                          }`}>
                            Stage 0{idx + 1}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-mono bg-[#E8C97A]/15 text-[#E8C97A] border border-[#E8C97A]/20 px-2 py-0.5 rounded-full uppercase animate-pulse">
                              Active
                            </span>
                          )}
                        </div>

                        <h3 className={`text-base font-extrabold uppercase tracking-wide transition-colors ${
                          isActive ? "text-[#F0F5EA]" : "text-[#F0F5EA]/70 group-hover:text-[#F0F5EA]"
                        }`}>
                          {step.title}
                        </h3>

                        <p className={`text-xs font-semibold ${
                          isActive ? "text-[#E8C97A]/90" : "text-[#F0F5EA]/45"
                        }`}>
                          {step.subtitle}
                        </p>

                        <div className={`transition-all duration-500 overflow-hidden ${
                          isActive ? "max-h-48 opacity-100 mt-2" : "max-h-0 opacity-0"
                        }`}>
                          <p className="text-xs text-[#F0F5EA]/80 leading-relaxed font-medium">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>

              </div>

            </div>

            {/* Bottom info strip */}
            <div className="flex justify-between items-center text-[10px] font-mono text-[#F0F5EA]/40 border-t border-[#F0F5EA]/10 pt-4 mt-auto">
              <span>BAKEWELL DIGITAL EXPERIENCE ENGINE // V1.0</span>
              <span>SCROLL DOWN TO PROGRESS ANIMATION OR USE SLIDER CONTROL</span>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
