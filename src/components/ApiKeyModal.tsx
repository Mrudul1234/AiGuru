import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Key } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (apiKey: string) => void;
  isLimitExceeded?: boolean;
}

export function ApiKeyModal({ isOpen, onClose, onSubmit, isLimitExceeded }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsSubmitting(true);
    try {
      onSubmit(apiKey.trim());
      setApiKey("");
      onClose();
    } catch (error) {
      console.error('Error setting API key:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-card border border-border/30">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isLimitExceeded ? (
              <AlertTriangle className="h-6 w-6 text-warning" />
            ) : (
              <Key className="h-6 w-6 text-primary" />
            )}
            <DialogTitle className="text-xl text-white">
              {isLimitExceeded ? "API Limit Exceeded" : "Set Gemini API Key"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            {isLimitExceeded ? (
              "The current API key has reached its usage limit. Please enter a new Gemini API key to continue chatting."
            ) : (
              "Enter your Gemini API key to enable AI chat functionality. This key will be shared among all users until the daily limit is reached."
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-white">
              Gemini API Key
            </Label>
            <Input
              id="apiKey"
              type="text"
              placeholder="Paste your Gemini API key here (AIzaSy...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-input border-border/30 text-white placeholder:text-muted-foreground"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Get your free API key from{" "}
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-border/30"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!apiKey.trim() || isSubmitting}
              className="bg-gradient-primary hover:opacity-90"
            >
              {isSubmitting ? "Setting..." : "Set API Key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}