import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  language?: string;
  onSpeak?: (text: string, lang?: string) => void;
  isLoading?: boolean;
}

export function ChatMessage({ 
  message, 
  isUser, 
  timestamp, 
  language = "en",
  onSpeak,
  isLoading = false 
}: ChatMessageProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      onSpeak?.(message, language);
      setIsSpeaking(true);
      // Reset speaking state when speech ends
      setTimeout(() => setIsSpeaking(false), message.length * 50);
    }
  };

  return (
    <div className={cn(
      "flex w-full animate-slide-up",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 backdrop-blur-sm transition-all duration-300",
        isUser 
          ? "bg-gradient-primary text-primary-foreground shadow-lg" 
          : "glass border border-border/50 text-foreground"
      )}>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse [animation-delay:0.4s]"></div>
                </div>
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
            )}
          </div>
          
          {!isUser && !isLoading && onSpeak && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSpeak}
              className="h-8 w-8 p-0 hover:bg-primary/20"
            >
              {isSpeaking ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        <div className="mt-2 text-xs opacity-60">
          {timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
          {language !== "en" && (
            <span className="ml-2 px-2 py-0.5 bg-primary/20 rounded-full text-xs">
              {language.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}