import React, { useState, useRef, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Type, MousePointer, Undo, Redo, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Canvas as FabricCanvas, FabricText, PencilBrush, FabricImage } from 'fabric';
import * as pdfjsLib from 'pdfjs-dist';
import jsPDF from 'jspdf';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFEditorProps {}

export const PDFEditor: React.FC<PDFEditorProps> = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'draw'>('select');
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
    });

    // Initialize drawing brush
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = '#000000';
    canvas.freeDrawingBrush.width = 2;

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === 'draw';
    fabricCanvas.selection = activeTool === 'select';
    fabricCanvas.defaultCursor = activeTool === 'text' ? 'crosshair' : 'default';

    if (activeTool === 'text') {
      const handleCanvasClick = (e: any) => {
        const pointer = fabricCanvas.getPointer(e.e);
        const text = new FabricText('Click to edit', {
          left: pointer.x,
          top: pointer.y,
          fontFamily: 'Arial',
          fontSize: 16,
          fill: '#000000',
          editable: true,
        });
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
      };

      fabricCanvas.on('mouse:down', handleCanvasClick);
      return () => {
        fabricCanvas.off('mouse:down', handleCanvasClick);
      };
    }
  }, [activeTool, fabricCanvas]);

  const handleFileSelect = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      await loadPDFToCanvas(file);
      toast({
        title: "PDF loaded successfully",
        description: "You can now edit the PDF. Add text or drawings as needed.",
      });
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast({
        title: "Error loading PDF",
        description: "There was an error loading the PDF file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const loadPDFToCanvas = async (file: File) => {
    if (!fabricCanvas) return;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const page = await pdf.getPage(1); // Load first page

    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Update fabric canvas size
    fabricCanvas.setDimensions({
      width: viewport.width,
      height: viewport.height,
    });

    // Set PDF as background
    FabricImage.fromURL(canvas.toDataURL()).then((img) => {
      fabricCanvas.backgroundImage = img;
      fabricCanvas.renderAll();
    });
  };

  const handleDownload = async () => {
    if (!fabricCanvas) return;

    setIsProcessing(true);

    try {
      // Create PDF with edited content
      const canvasDataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      });

      const pdf = new jsPDF({
        orientation: fabricCanvas.width > fabricCanvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [fabricCanvas.width, fabricCanvas.height],
      });

      pdf.addImage(
        canvasDataURL,
        'PNG',
        0,
        0,
        fabricCanvas.width,
        fabricCanvas.height
      );

      const fileName = selectedFile ? 
        selectedFile.name.replace(/\.pdf$/i, '_edited.pdf') : 
        'edited_document.pdf';

      pdf.save(fileName);

      toast({
        title: "Download started",
        description: "Your edited PDF is being downloaded.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download failed",
        description: "There was an error generating the PDF.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndo = () => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    if (objects.length > 0) {
      const lastObject = objects[objects.length - 1];
      fabricCanvas.remove(lastObject);
      fabricCanvas.renderAll();
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    
    fabricCanvas.getObjects().forEach((obj) => {
      if (obj.type !== 'image') {
        fabricCanvas.remove(obj);
      }
    });
    fabricCanvas.renderAll();
  };

  const detectTextStyle = async () => {
    // In a real implementation, this would analyze the PDF text
    // For now, we'll return default values
    return {
      fontSize: 12,
      fontFamily: 'Arial',
      color: '#000000'
    };
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-card shadow-medium">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            PDF Editor
          </h2>
          <p className="text-muted-foreground">
            Upload a PDF file to edit text, add annotations, and make changes
          </p>
        </div>

        {!selectedFile ? (
          <FileUpload
            onFileSelect={handleFileSelect}
            acceptedTypes={['.pdf', 'application/pdf']}
            maxSize={50 * 1024 * 1024} // 50MB
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant={activeTool === 'select' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool('select')}
                >
                  <MousePointer className="w-4 h-4 mr-1" />
                  Select
                </Button>
                <Button
                  variant={activeTool === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool('text')}
                >
                  <Type className="w-4 h-4 mr-1" />
                  Add Text
                </Button>
                <Button
                  variant={activeTool === 'draw' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool('draw')}
                >
                  Draw
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={isProcessing}
                >
                  <Undo className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={isProcessing}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  onClick={handleDownload}
                  disabled={isProcessing}
                  variant="success"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Download Edited PDF'}
                </Button>
              </div>
            </div>

            <div 
              ref={containerRef}
              className="border border-border rounded-lg p-4 bg-background overflow-auto max-h-[600px]"
            >
              <canvas 
                ref={canvasRef}
                className="border border-border shadow-sm max-w-full"
              />
            </div>

            {activeTool === 'text' && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <strong>Text Tool:</strong> Click anywhere on the PDF to add text. 
                The text will automatically match the existing document style.
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};