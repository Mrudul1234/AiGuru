import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "./ChatMessage";
import { VoiceButton } from "./VoiceButton";
import { FileUpload } from "./FileUpload";
import { WelcomeScreen } from "./WelcomeScreen";
import { ApiKeyModal } from "./ApiKeyModal";
import { Send, FileText, X, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { detectLanguage, generateResponse, speakText, translateText, checkUsageLimit, setApiKey } from "@/services/aiService";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  language: string;
}

interface UploadedFile {
  name: string;
  content: string;
  isImage: boolean;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [usageInfo, setUsageInfo] = useState({ canUse: true, remaining: 4 });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isLimitExceeded, setIsLimitExceeded] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUsageInfo(checkUsageLimit());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (text: string, isUser: boolean, language: string = 'en') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
      language
    };
    setMessages(prev => [...prev, newMessage]);
    setShowWelcome(false);
    return newMessage;
  };

  const handleSendMessage = async (text: string, detectedLang: string = 'en') => {
    if (!text.trim()) return;

    // Check usage limit before proceeding
    const currentUsage = checkUsageLimit();
    if (!currentUsage.canUse) {
      addMessage(
        `Daily usage limit reached (4 times). Try again tomorrow! You have ${currentUsage.remaining} uses remaining.`,
        false, 
        detectedLang
      );
      return;
    }

    // Add user message
    addMessage(text, true, detectedLang);
    setInputValue("");
    setIsLoading(true);

    try {
      // Detect language if not provided
      const userLanguage = detectedLang === 'en' ? await detectLanguage(text) : detectedLang;
      
      // Prepare context from uploaded files
      let fileContext = "";
      let isImageQuery = false;
      
      if (uploadedFiles.length > 0) {
        const latestFile = uploadedFiles[uploadedFiles.length - 1];
        fileContext = latestFile.content;
        isImageQuery = latestFile.isImage;
      }

      // Translate to English if needed for AI processing
      const englishText = userLanguage !== 'en' 
        ? await translateText(text, userLanguage, 'en') 
        : text;

      // Generate AI response
      const aiResponse = await generateResponse(
        englishText, 
        undefined, 
        fileContext,
        isImageQuery
      );

      // Translate back to user's language if needed
      const translatedResponse = userLanguage !== 'en' 
        ? await translateText(aiResponse, 'en', userLanguage) 
        : aiResponse;

      // Add AI response
      addMessage(translatedResponse, false, userLanguage);
      
      // Update usage info
      setUsageInfo(checkUsageLimit());
      
    } catch (error: any) {
      console.error('Error generating response:', error);
      
      if (error.message === 'LIMIT_EXCEEDED' || error.message === 'API_QUOTA_EXCEEDED') {
        setIsLimitExceeded(true);
        setShowApiKeyModal(true);
        addMessage(
          "Daily usage limit reached. Please enter a new API key to continue chatting.", 
          false, 
          detectedLang
        );
      } else if (error.message === 'INVALID_API_KEY') {
        setIsLimitExceeded(false);
        setShowApiKeyModal(true);
        addMessage(
          "Invalid API key. Please enter a valid Gemini API key.", 
          false, 
          detectedLang
        );
      } else {
        addMessage(
          "Sorry, I encountered an error processing your request. Please try again.", 
          false, 
          detectedLang
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async (transcript: string, language: string) => {
    await handleSendMessage(transcript, language);
  };

  const handleFileUpload = (file: File, content: string) => {
    const isImage = file.type.includes('image');
    const uploadedFile: UploadedFile = {
      name: file.name,
      content,
      isImage
    };
    
    setUploadedFiles([uploadedFile]); // Replace previous file for simplicity
    setShowFileUpload(false);
    
    // Add confirmation message
    addMessage(
      `File "${file.name}" uploaded successfully! You can now ask questions about its content.`,
      false,
      'en'
    );
  };

  const handleSpeak = async (text: string, language: string = 'en') => {
    try {
      await speakText(text, language);
    } catch (error) {
      console.error('Speech error:', error);
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const handleApiKeySubmit = (apiKey: string) => {
    setApiKey(apiKey);
    setUsageInfo(checkUsageLimit());
    setIsLimitExceeded(false);
    addMessage(
      "API key updated successfully! You can now continue chatting.", 
      false, 
      'en'
    );
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gradient-bg">
      {/* Header */}
      <div className="border-b border-border/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="text-lg font-bold text-white">AI</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                AiGuru
              </h1>
              <p className="text-sm text-muted-foreground">
                Your intelligent AI companion for text, voice, and file analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowApiKeyModal(true)}
              className="h-8 px-3 text-xs text-muted-foreground hover:text-white"
            >
              <Settings className="h-3 w-3 mr-1" />
              API Key
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-green-500">Ready</span>
            </div>
          </div>
        </div>

        {/* Uploaded Files Indicator */}
        {uploadedFiles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-xs"
              >
                <FileText className="h-3 w-3" />
                <span className="truncate max-w-32">{file.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(file.name)}
                  className="h-4 w-4 p-0 hover:bg-destructive/20"
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Upload Area */}
      {showFileUpload && (
        <div className="glass border-b border-border/50 p-4">
          <FileUpload onFileUpload={handleFileUpload} />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {showWelcome && messages.length === 0 ? (
          <WelcomeScreen 
            onStartChat={() => setShowWelcome(false)}
            onShowFileUpload={() => setShowFileUpload(true)}
          />
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message.text}
                isUser={message.isUser}
                timestamp={message.timestamp}
                language={message.language}
                onSpeak={handleSpeak}
              />
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <ChatMessage
                message=""
                isUser={false}
                timestamp={new Date()}
                isLoading={true}
              />
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border/30 p-4">
        <div className="flex items-center gap-3 bg-card rounded-2xl p-3 border border-border/30">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message... (supports any language)"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(inputValue);
              }
            }}
            disabled={isLoading}
            className="border-0 bg-transparent focus-visible:ring-0 text-white placeholder:text-muted-foreground"
          />
          
          <div className="flex items-center gap-2">
            <VoiceButton
              onVoiceInput={handleVoiceInput}
              isListening={isListening}
              onListeningChange={setIsListening}
            />
            
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim() || !usageInfo.canUse}
              size="icon"
              className="h-10 w-10 rounded-xl bg-gradient-primary hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-blue-400">Multi-Language</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span className="text-orange-400">File Analysis</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span className="text-purple-400">Voice Chat</span>
          </div>
        </div>
        
        <div className="flex items-center justify-center mt-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-green-500">AI Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${usageInfo.remaining > 2 ? 'bg-green-500' : usageInfo.remaining > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <span className={`text-xs ${usageInfo.remaining > 2 ? 'text-green-500' : usageInfo.remaining > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                {usageInfo.remaining} uses left today
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSubmit={handleApiKeySubmit}
        isLimitExceeded={isLimitExceeded}
      />
    </div>
  );
}