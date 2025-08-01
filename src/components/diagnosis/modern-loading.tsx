"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Zap, CheckCircle, Loader2 } from "lucide-react";

interface ModernLoadingProps {
  onComplete?: () => void;
  duration: number; // Menerima durasi dari props
}

export function ModernLoading({ onComplete, duration }: ModernLoadingProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const steps = [
    { icon: Brain, text: "Menganalisis gejala...", color: "text-blue-600" },
    { icon: Zap, text: "Menghitung probabilitas...", color: "text-purple-600" },
    { icon: CheckCircle, text: "Menyiapkan hasil...", color: "text-green-600" },
  ];

  useEffect(() => {
    // Reset state saat komponen dimuat
    setProgress(0);
    setCurrentStep(0);
    setIsComplete(false);
    setIsVisible(true);

    const progressInterval = 50; // Update every 50ms for smooth animation
    const totalIncrements = duration / progressInterval;
    const incrementAmount = 100 / totalIncrements;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + incrementAmount;

        // Update current step based on progress
        const stepIndex = Math.floor((newProgress / 100) * steps.length);
        if (stepIndex !== currentStep && stepIndex < steps.length) {
          setCurrentStep(stepIndex);
        }

        if (newProgress >= 100) {
          clearInterval(timer);
          setIsComplete(true);
          // Tunggu sebentar setelah selesai sebelum menutup modal
          setTimeout(() => {
            setIsVisible(false);
            onComplete?.();
          }, 500); // Durasi 500ms untuk transisi keluar
          return 100;
        }

        return newProgress;
      });
    }, progressInterval);

    return () => clearInterval(timer);
  }, [duration, onComplete]);

  const CurrentIcon = steps[currentStep]?.icon || Loader2;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500
      ${isVisible ? "bg-black/50 backdrop-blur-sm opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      <div
        className={`w-full max-w-xs mx-4 transition-all duration-500
        ${isVisible ? "scale-100 ease-out" : "scale-90 ease-in"}`}
      >
        <Card className="shadow-lg border-0">
          <CardContent className="p-6 text-center space-y-4">
            {/* Animated Icon */}
            <div className="relative">
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center 
              bg-gradient-to-br from-blue-300 to-purple-300 dark:from-amber-400 dark:to-teal-400
              transition-colors duration-300 shadow-md ring-1 ring-gray-300 dark:ring-gray-700"
              >
                <CurrentIcon
                  className={`w-8 h-8 ${steps[currentStep]?.color || "text-blue-600 dark:text-amber-500"} ${!isComplete ? "animate-pulse" : ""
                    } transition-transform duration-200`}
                />
              </div>
              {!isComplete && (
                <div className="absolute inset-0 w-16 h-16 mx-auto border-2 border-blue-200 rounded-full animate-spin border-t-blue-600" />
              )}
            </div>

            {/* Progress Text */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-300">{isComplete ? "Selesai!" : "Memproses Diagnosa"}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isComplete ? "Hasil siap ditampilkan" : steps[currentStep]?.text || "Memuat..."}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500">{Math.round(progress)}%</p>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${index <= currentStep ? "bg-blue-600" : "bg-gray-300"
                    }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}