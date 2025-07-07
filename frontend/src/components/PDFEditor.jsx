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
import ApiService from '../services/apiService';

const PDFEditor = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pdfId, setPdfId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedTool, setSelectedTool] = useState('select');
  const [annotations, setAnnotations] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [layers, setLayers] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load signatures when component mounts
    loadSignatures();
    
    // Check API health
    ApiService.healthCheck()
      .then(data => {
        console.log('API Health Check:', data);
      })
      .catch(error => {
        console.error('API Health Check Failed:', error);
        toast({
          title: "API Connection Error",
          description: "Unable to connect to the backend server",
          variant: "destructive"
        });
      });
  }, []);

  useEffect(() => {
    // Load annotations when PDF changes
    if (pdfId) {
      loadAnnotations();
    }
  }, [pdfId]);

  const loadSignatures = async () => {
    try {
      const signatures = await ApiService.getSignatures();
      setSignatures(signatures);
    } catch (error) {
      console.error('Error loading signatures:', error);
      // Fallback to local storage for signatures
      const savedSignatures = localStorage.getItem('pdfEditor_signatures');
      if (savedSignatures) {
        setSignatures(JSON.parse(savedSignatures));
      }
    }
  };

  const loadAnnotations = async () => {
    try {
      const response = await ApiService.getAnnotations(pdfId);
      setAnnotations(response.annotations || []);
    } catch (error) {
      console.error('Error loading annotations:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

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

    setIsLoading(true);
    try {
      const uploadResponse = await ApiService.uploadPDF(file);
      
      setPdfFile(file);
      setPdfDocument(uploadResponse);
      setPdfId(uploadResponse.id);
      setCurrentPage(1);
      setTotalPages(uploadResponse.total_pages);
      setAnnotations([]);
      setLayers([]);
      setHistory([]);
      setHistoryIndex(-1);
      
      toast({
        title: "PDF loaded successfully",
        description: `${file.name} is ready for editing`
      });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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

  const handleAddAnnotation = async (annotationData) => {
    if (!pdfId) {
      toast({
        title: "No PDF loaded",
        description: "Please upload a PDF first",
        variant: "destructive"
      });
      return;
    }

    try {
      const annotationRequest = {
        ...annotationData,
        pdf_id: pdfId,
        page: currentPage,
        layer: layers.length
      };

      const newAnnotation = await ApiService.createAnnotation(annotationRequest);
      setAnnotations(prev => [...prev, newAnnotation]);
      addToHistory([...annotations, newAnnotation]);
      
      toast({
        title: "Annotation added",
        description: `${annotationData.type} added to page ${currentPage}`
      });
    } catch (error) {
      console.error('Error adding annotation:', error);
      toast({
        title: "Error adding annotation",
        description: "Failed to save annotation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddSignature = async (signatureData) => {
    if (!pdfId) {
      toast({
        title: "No PDF loaded",
        description: "Please upload a PDF first",
        variant: "destructive"
      });
      return;
    }

    try {
      const annotationRequest = {
        ...signatureData,
        pdf_id: pdfId,
        page: currentPage,
        layer: layers.length
      };

      const newAnnotation = await ApiService.createAnnotation(annotationRequest);
      setAnnotations(prev => [...prev, newAnnotation]);
      addToHistory([...annotations, newAnnotation]);
      
      toast({
        title: "Signature added",
        description: `Signature placed on page ${currentPage}`
      });
    } catch (error) {
      console.error('Error adding signature:', error);
      toast({
        title: "Error adding signature",
        description: "Failed to save signature. Please try again.",
        variant: "destructive"
      });
    }
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
    // Mock export functionality for now
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

  const handleSaveProject = async () => {
    if (!pdfId) {
      toast({
        title: "No PDF loaded",
        description: "Please upload a PDF first",
        variant: "destructive"
      });
      return;
    }

    try {
      const projectData = {
        name: `Project ${new Date().toLocaleDateString()}`,
        pdf_id: pdfId,
        current_page: currentPage,
        zoom_level: zoomLevel
      };

      await ApiService.createProject(projectData);
      
      toast({
        title: "Project saved",
        description: "Your work has been saved to the database"
      });
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Save failed",
        description: "Failed to save project. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getPdfUrl = () => {
    if (!pdfId) return null;
    return ApiService.getPDFFileUrl(pdfId);
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
                disabled={isLoading}
              >
                <Upload className="h-4 w-4" />
                <span>{isLoading ? 'Uploading...' : 'Upload PDF'}</span>
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
              disabled={!pdfId}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExport}
              disabled={!pdfId}
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
                  disabled={currentPage === 1 || !pdfId}
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
                  disabled={currentPage === totalPages || !pdfId}
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
            {pdfId ? (
              <PDFViewer
                pdfUrl={getPdfUrl()}
                currentPage={currentPage}
                zoomLevel={zoomLevel}
                selectedTool={selectedTool}
                annotations={annotations}
                onAddAnnotation={handleAddAnnotation}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No PDF loaded
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Upload a PDF file to start editing
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isLoading ? 'Uploading...' : 'Upload PDF'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFEditor;