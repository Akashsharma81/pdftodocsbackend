import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { ConversionProgress } from './ConversionProgress';
import { ConversionHistory } from './ConversionHistory';
import { PDFEditor } from './PDFEditor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, RefreshCw, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConversionRecord {
  id: string;
  originalName: string;
  convertedName: string;
  fromType: string;
  toType: string;
  timestamp: Date;
  downloadUrl?: string;
}

export const DocumentConverter: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'uploading' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [convertedFile, setConvertedFile] = useState<{ name: string; url: string } | null>(null);
  const [conversionHistory, setConversionHistory] = useState<ConversionRecord[]>([]);
  const [activeTab, setActiveTab] = useState('pdf-to-doc');
  const { toast } = useToast();

  const docTypes = {
    'pdf-to-doc': {
      title: 'PDF to DOC',
      subtitle: 'Convert PDF files to editable Word documents',
      accept: ['.pdf', 'application/pdf'],
      outputType: 'doc'
    },
    'doc-to-pdf': {
      title: 'DOC to PDF',
      subtitle: 'Convert Word documents to PDF format',
      accept: ['.doc', '.docx', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      outputType: 'pdf'
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setConversionStatus('idle');
    setConvertedFile(null);
  };

  const simulateConversion = async () => {
    if (!selectedFile) return;

    setConversionStatus('uploading');
    setProgress(0);

    // Simulate upload progress
    for (let i = 0; i <= 30; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setConversionStatus('converting');

    // Simulate conversion progress
    for (let i = 30; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Simulate conversion completion
    const currentType = docTypes[activeTab as keyof typeof docTypes];
    const convertedFileName = selectedFile.name.replace(/\.[^/.]+$/, `.${currentType.outputType}`);
    
    setConvertedFile({
      name: convertedFileName,
      url: URL.createObjectURL(selectedFile) // In real app, this would be the converted file URL
    });

    // Add to history
    const newRecord: ConversionRecord = {
      id: Date.now().toString(),
      originalName: selectedFile.name,
      convertedName: convertedFileName,
      fromType: selectedFile.type,
      toType: currentType.outputType,
      timestamp: new Date(),
      downloadUrl: URL.createObjectURL(selectedFile)
    };

    setConversionHistory(prev => [newRecord, ...prev.slice(0, 4)]); // Keep last 5 records
    setConversionStatus('completed');

    toast({
      title: "Conversion completed!",
      description: `${selectedFile.name} has been converted successfully.`,
    });
  };

  const handleDownload = (record?: ConversionRecord) => {
    if (!record && !convertedFile) return;

    // In a real application, this would trigger an actual download
    const link = document.createElement('a');
    link.href = record?.downloadUrl || convertedFile?.url || '';
    link.download = record?.convertedName || convertedFile?.name || '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: "Your converted file is being downloaded.",
    });
  };

  const resetConversion = () => {
    setSelectedFile(null);
    setConversionStatus('idle');
    setProgress(0);
    setConvertedFile(null);
  };

  const currentType = docTypes[activeTab as keyof typeof docTypes];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Document Converter
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Convert your documents between PDF and DOC formats with ease. Fast, secure, and free.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
          <TabsTrigger value="pdf-to-doc">PDF to DOC</TabsTrigger>
          <TabsTrigger value="doc-to-pdf">DOC to PDF</TabsTrigger>
          <TabsTrigger value="pdf-editor">PDF Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="pdf-to-doc" className="space-y-6">
          <Card className="p-8 bg-gradient-card shadow-medium">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                {docTypes['pdf-to-doc'].title}
              </h2>
              <p className="text-muted-foreground">{docTypes['pdf-to-doc'].subtitle}</p>
            </div>

            <FileUpload
              onFileSelect={handleFileSelect}
              acceptedTypes={docTypes['pdf-to-doc'].accept}
              maxSize={50 * 1024 * 1024} // 50MB
            />

            {selectedFile && conversionStatus === 'idle' && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={simulateConversion}
                  variant="hero"
                  size="lg"
                  className="px-8"
                >
                  Convert to {docTypes['pdf-to-doc'].outputType.toUpperCase()}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </Card>

          {conversionStatus !== 'idle' && (
            <ConversionProgress
              status={conversionStatus}
              progress={progress}
              fileName={selectedFile?.name}
              errorMessage="Something went wrong during conversion. Please try again."
            />
          )}

          {convertedFile && conversionStatus === 'completed' && (
            // <Card className="p-6 bg-gradient-card shadow-medium">
            //   <div className="flex items-center justify-between">
            //     <div>
            //       <h3 className="text-lg font-semibold text-foreground mb-1">
            //         Conversion Complete!
            //       </h3>
            //       <p className="text-muted-foreground">{convertedFile.name}</p>
            //     </div>
            //     <div className="flex space-x-3">
            //       <Button
            //         onClick={() => handleDownload()}
            //         variant="success"
            //         size="lg"
            //       >
            //         <Download className="w-4 h-4 mr-2" />
            //         Download
            //       </Button>
            //       <Button
            //         onClick={resetConversion}
            //         variant="outline"
            //         size="lg"
            //       >
            //         <RefreshCw className="w-4 h-4 mr-2" />
            //         Convert Another
            //       </Button>
            //     </div>
            //   </div>
            // </Card>

            <Card className="p-6 bg-gradient-card shadow-medium">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        Conversion Complete!
      </h3>
      <p className="text-muted-foreground">{convertedFile.name}</p>
    </div>
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={() => handleDownload()}
        variant="success"
        size="lg"
      >
      {/* // changes */}
        <Download className="w-4 h-4 mr-2" />
        Download
      </Button>
      <Button
        onClick={resetConversion}
        variant="outline"
        size="lg"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Convert Another
      </Button>
    </div>
  </div>
</Card>

          )}

          <ConversionHistory
            history={conversionHistory}
            onDownload={handleDownload}
          />
        </TabsContent>

        <TabsContent value="doc-to-pdf" className="space-y-6">
          <Card className="p-8 bg-gradient-card shadow-medium">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                {docTypes['doc-to-pdf'].title}
              </h2>
              <p className="text-muted-foreground">{docTypes['doc-to-pdf'].subtitle}</p>
            </div>

            <FileUpload
              onFileSelect={handleFileSelect}
              acceptedTypes={docTypes['doc-to-pdf'].accept}
              maxSize={50 * 1024 * 1024} // 50MB
            />

            {selectedFile && conversionStatus === 'idle' && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={simulateConversion}
                  variant="hero"
                  size="lg"
                  className="px-8"
                >
                  Convert to {docTypes['doc-to-pdf'].outputType.toUpperCase()}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </Card>

          {conversionStatus !== 'idle' && (
            <ConversionProgress
              status={conversionStatus}
              progress={progress}
              fileName={selectedFile?.name}
              errorMessage="Something went wrong during conversion. Please try again."
            />
          )}

          {convertedFile && conversionStatus === 'completed' && (
            <Card className="p-6 bg-gradient-card shadow-medium">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Conversion Complete!
                  </h3>
                  <p className="text-muted-foreground">{convertedFile.name}</p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleDownload()}
                    variant="success"
                    size="lg"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={resetConversion}
                    variant="outline"
                    size="lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Convert Another
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <ConversionHistory
            history={conversionHistory}
            onDownload={handleDownload}
          />
        </TabsContent>

        <TabsContent value="pdf-editor" className="space-y-6">
          <PDFEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
};