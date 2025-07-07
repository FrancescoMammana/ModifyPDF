import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { useToast } from '../hooks/use-toast';
import { 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download,
  Type,
  Image,
  Highlighter,
  Square,
  Circle,
  ArrowRight,
  Edit3,
  Layers,
  Undo,
  Redo,
  Save
} from 'lucide-react';
import PDFViewer from './PDFViewer';
import ToolPanel from './ToolPanel';
import SignatureLibrary from './SignatureLibrary';
import LayerManager from './LayerManager';
import { mockPDFData } from '../data/mockData';

const PDFEditor = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfData, setPdfData] = useState(mockPDFData);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(3);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedTool, setSelectedTool] = useState('select');
  const [annotations, setAnnotations] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [layers, setLayers] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved signatures from localStorage
    const savedSignatures = localStorage.getItem('pdfEditor_signatures');
    if (savedSignatures) {
      setSignatures(JSON.parse(savedSignatures));
    }
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast({
          title: "File too large",
          description: "PDF file must be smaller than 100MB",
          variant: "destructive"
        });
        return;
      }
      
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file",
          variant: "destructive"
        });
        return;
      }

      setPdfFile(file);
      setPdfData(URL.createObjectURL(file));
      setCurrentPage(1);
      setAnnotations([]);
      setLayers([]);
      setHistory([]);
      setHistoryIndex(-1);
      
      toast({
        title: "PDF loaded successfully",
        description: `${file.name} is ready for editing`
      });
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handlePageChange = (direction) => {
    if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    } else if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
    toast({
      title: `Tool selected: ${tool}`,
      description: `Click on the PDF to use the ${tool} tool`
    });
  };

  const handleAddAnnotation = (annotation) => {
    const newAnnotation = {
      ...annotation,
      id: Date.now(),
      page: currentPage,
      layer: layers.length
    };
    
    setAnnotations(prev => [...prev, newAnnotation]);
    addToHistory([...annotations, newAnnotation]);
    
    toast({
      title: "Annotation added",
      description: `${annotation.type} added to page ${currentPage}`
    });
  };

  const handleAddSignature = (signature) => {
    const newSignature = {
      ...signature,
      id: Date.now(),
      page: currentPage
    };
    
    setAnnotations(prev => [...prev, newSignature]);
    addToHistory([...annotations, newSignature]);
    
    toast({
      title: "Signature added",
      description: `Signature placed on page ${currentPage}`
    });
  };

  const addToHistory = (newAnnotations) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1]);
      toast({
        title: "Undone",
        description: "Last action has been undone"
      });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1]);
      toast({
        title: "Redone",
        description: "Action has been redone"
      });
    }
  };

  const handleExport = () => {
    // Mock export functionality
    toast({
      title: "Export started",
      description: "Your PDF is being processed for download..."
    });
    
    setTimeout(() => {
      toast({
        title: "Export complete",
        description: "Your edited PDF is ready for download"
      });
    }, 2000);
  };

  const handleSaveProject = () => {
    const projectData = {
      annotations,
      layers,
      currentPage,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('pdfEditor_project', JSON.stringify(projectData));
    toast({
      title: "Project saved",
      description: "Your work has been saved locally"
    });
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">PDF Editor</h1>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Upload PDF</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveProject}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              <span className="ml-2">Export</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <Tabs defaultValue="tools" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="signatures">Signatures</TabsTrigger>
              <TabsTrigger value="layers">Layers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tools" className="p-4">
              <ToolPanel
                selectedTool={selectedTool}
                onToolSelect={handleToolSelect}
                onAddAnnotation={handleAddAnnotation}
              />
            </TabsContent>
            
            <TabsContent value="signatures" className="p-4">
              <SignatureLibrary
                signatures={signatures}
                onSignaturesChange={setSignatures}
                onAddSignature={handleAddSignature}
              />
            </TabsContent>
            
            <TabsContent value="layers" className="p-4">
              <LayerManager
                layers={layers}
                annotations={annotations}
                onLayersChange={setLayers}
                onAnnotationsChange={setAnnotations}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - PDF Viewer */}
        <div className="flex-1 flex flex-col">
          {/* PDF Controls */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange('prev')}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange('next')}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-[4rem] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 bg-gray-100 overflow-auto">
            <PDFViewer
              pdfData={pdfData}
              currentPage={currentPage}
              zoomLevel={zoomLevel}
              selectedTool={selectedTool}
              annotations={annotations}
              onAddAnnotation={handleAddAnnotation}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFEditor;