import { useState, useCallback } from "react";
import { Upload, File, Image, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileUpload: (file: File, content: string) => void;
  className?: string;
}

export function FileUpload({ onFileUpload, className }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    
    try {
      let content = "";
      
      if (file.type.includes('image')) {
        // For images, convert to base64
        const reader = new FileReader();
        content = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      } else if (file.type === 'application/pdf') {
        // For PDFs, extract text using pdf-parse
        const arrayBuffer = await file.arrayBuffer();
        const pdfParse = await import('pdf-parse');
        const pdfData = await pdfParse.default(arrayBuffer);
        content = pdfData.text;
      } else if (file.type.includes('officedocument.wordprocessingml') || file.name.endsWith('.docx')) {
        // For DOCX files, extract text using mammoth
        const arrayBuffer = await file.arrayBuffer();
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        // For text files, read directly
        content = await file.text();
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }

      onFileUpload(file, content);
      setUploadedFiles(prev => [...prev, file.name]);
    } catch (error) {
      console.error('Error processing file:', error);
      alert(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(processFile);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(processFile);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="h-4 w-4" />;
    } else if (ext === 'pdf') {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (['doc', 'docx'].includes(ext || '')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    }
    return <File className="h-4 w-4" />;
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f !== fileName));
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer glass",
          isDragOver 
            ? "border-primary bg-primary/10 scale-[1.02]" 
            : "border-border/50 hover:border-primary/50 hover:bg-card/20",
          isProcessing && "opacity-50 pointer-events-none"
        )}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "p-4 rounded-full transition-colors duration-300",
            isDragOver ? "bg-primary/20" : "bg-muted/50"
          )}>
            <Upload className={cn(
              "h-8 w-8 transition-colors duration-300",
              isDragOver ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {isProcessing ? "Processing files..." : "Drop files here or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF, DOCX, TXT, and images (JPG, PNG)
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Files:</p>
          <div className="space-y-2">
            {uploadedFiles.map((fileName, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg glass border border-border/50"
              >
                {getFileIcon(fileName)}
                <span className="flex-1 text-sm truncate">{fileName}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(fileName)}
                  className="h-6 w-6 p-0 hover:bg-destructive/20"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}