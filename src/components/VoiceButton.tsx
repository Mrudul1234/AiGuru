import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  onVoiceInput: (transcript: string, language: string) => void;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
  className?: string;
}

export function VoiceButton({ 
  onVoiceInput, 
  isListening, 
  onListeningChange, 
  className 
}: VoiceButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Try to detect language automatically
    recognition.lang = navigator.language || 'en-US';

    recognition.onstart = () => {
      onListeningChange(true);
      setIsProcessing(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const detectedLanguage = recognition.lang.split('-')[0]; // Extract language code
      
      setIsProcessing(true);
      onVoiceInput(transcript, detectedLanguage);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      onListeningChange(false);
      setIsProcessing(false);
    };

    recognition.onend = () => {
      onListeningChange(false);
      setIsProcessing(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    onListeningChange(false);
  };

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <Button
      variant="voice"
      size="voice"
      onClick={handleClick}
      disabled={isProcessing}
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        isListening && "animate-pulse-glow scale-110",
        className
      )}
    >
      {/* Animated background for listening state */}
      {isListening && (
        <div className="absolute inset-0 bg-gradient-voice animate-pulse opacity-50" />
      )}
      
      {/* Icon */}
      <div className="relative z-10">
        {isProcessing ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : isListening ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </div>
      
      {/* Voice wave animation */}
      {isListening && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-1 bg-primary/60 rounded-full animate-voice-wave"
                style={{
                  height: `${20 + Math.random() * 20}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      )}
    </Button>
  );
}