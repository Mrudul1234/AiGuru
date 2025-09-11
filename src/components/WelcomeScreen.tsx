import { Upload, Mic, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  onStartChat: () => void;
  onShowFileUpload: () => void;
}

export function WelcomeScreen({ onStartChat, onShowFileUpload }: WelcomeScreenProps) {
  const features = [
    {
      icon: <Mic className="w-6 h-6" />,
      title: "Voice Chat - Speak in any language",
      description: "Natural voice interaction in your preferred language",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Upload className="w-6 h-6" />,
      title: "File Analysis - Upload PDFs, images & docs",
      description: "Analyze documents, images, and text files instantly",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Multi-Language - Chat in your native language",
      description: "Seamless communication across language barriers",
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-white mb-4">
          Welcome to AiGuru
        </h2>
        <p className="text-lg text-muted-foreground max-w-md">
          Your intelligent AI companion for text, voice, and file analysis
        </p>
      </div>

      <div className="grid gap-4 w-full max-w-md mb-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="glass border border-border/30 rounded-2xl p-4 hover:border-primary/50 transition-all duration-300 group cursor-pointer"
            onClick={index === 1 ? onShowFileUpload : onStartChat}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-white text-sm mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-md">
        <div className="glass border-2 border-dashed border-border/30 rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 group cursor-pointer"
             onClick={onShowFileUpload}>
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted/20 group-hover:bg-primary/20 transition-colors duration-300">
              <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            </div>
            <div>
              <p className="font-medium text-white mb-1">Drop files here to analyze</p>
              <p className="text-sm text-muted-foreground">Supports PDF, DOCX, TXT, JPG, PNG files</p>
            </div>
            <Button 
              variant="default" 
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onShowFileUpload();
              }}
            >
              Choose Files
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}