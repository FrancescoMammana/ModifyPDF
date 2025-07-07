import React, { useRef, useEffect, useState } from 'react';
import { Card } from './ui/card';

const PDFViewer = ({ 
  pdfUrl, 
  currentPage, 
  zoomLevel, 
  selectedTool, 
  annotations, 
  onAddAnnotation 
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);

  useEffect(() => {
    if (pdfUrl) {
      loadPDF();
    }
  }, [pdfUrl, currentPage, zoomLevel]);

  useEffect(() => {
    drawAnnotations();
  }, [annotations, currentPage, zoomLevel, pdfLoaded]);

  const loadPDF = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !pdfUrl) return;

    try {
      // For now, create a mock PDF representation
      // In a full implementation, you would use PDF.js here
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 800 * zoomLevel;
      canvas.height = 1000 * zoomLevel;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw PDF page background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add a border
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Draw mock PDF content
      ctx.fillStyle = '#333';
      ctx.font = `${16 * zoomLevel}px Arial`;
      ctx.fillText(`PDF Page ${currentPage}`, 50 * zoomLevel, 50 * zoomLevel);
      
      // Draw some mock content lines to simulate real PDF
      ctx.font = `${12 * zoomLevel}px Arial`;
      for (let i = 0; i < 25; i++) {
        const lineText = `This is line ${i + 1} of the PDF document content. You can add annotations, signatures, and shapes to this document.`;
        ctx.fillText(
          lineText,
          50 * zoomLevel,
          (80 + i * 25) * zoomLevel
        );
      }

      // Add some mock form fields
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1 * zoomLevel;
      
      // Signature field
      ctx.strokeRect(400 * zoomLevel, 200 * zoomLevel, 200 * zoomLevel, 50 * zoomLevel);
      ctx.fillStyle = '#999';
      ctx.font = `${10 * zoomLevel}px Arial`;
      ctx.fillText('Signature:', 400 * zoomLevel, 190 * zoomLevel);
      
      // Date field
      ctx.strokeRect(400 * zoomLevel, 300 * zoomLevel, 150 * zoomLevel, 30 * zoomLevel);
      ctx.fillText('Date:', 400 * zoomLevel, 290 * zoomLevel);
      
      // Name field
      ctx.strokeRect(50 * zoomLevel, 700 * zoomLevel, 300 * zoomLevel, 30 * zoomLevel);
      ctx.fillText('Name:', 50 * zoomLevel, 690 * zoomLevel);

      setPdfLoaded(true);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setPdfLoaded(false);
    }
  };

  const drawAnnotations = () => {
    const canvas = canvasRef.current;
    if (!canvas || !pdfLoaded) return;

    const ctx = canvas.getContext('2d');
    
    // Redraw PDF first
    loadPDF().then(() => {
      // Draw annotations on top
      annotations
        .filter(annotation => annotation.page === currentPage)
        .forEach(annotation => {
          drawAnnotation(ctx, annotation);
        });
    });
  };

  const drawAnnotation = (ctx, annotation) => {
    const { type, x, y, width, height, color, text, image_data } = annotation;
    
    ctx.save();
    
    switch (type) {
      case 'text':
        ctx.fillStyle = color || '#000';
        ctx.font = `${(annotation.font_size || 14) * zoomLevel}px Arial`;
        ctx.fillText(text || 'Text', x * zoomLevel, y * zoomLevel);
        break;
        
      case 'rectangle':
        ctx.strokeStyle = color || '#000';
        ctx.lineWidth = 2 * zoomLevel;
        ctx.strokeRect(x * zoomLevel, y * zoomLevel, (width || 100) * zoomLevel, (height || 100) * zoomLevel);
        break;
        
      case 'circle':
        ctx.strokeStyle = color || '#000';
        ctx.lineWidth = 2 * zoomLevel;
        ctx.beginPath();
        const radius = Math.min(width || 50, height || 50) / 2;
        ctx.arc(
          (x + (width || 50) / 2) * zoomLevel,
          (y + (height || 50) / 2) * zoomLevel,
          radius * zoomLevel,
          0,
          2 * Math.PI
        );
        ctx.stroke();
        break;
        
      case 'highlight':
        ctx.fillStyle = color || 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(x * zoomLevel, y * zoomLevel, (width || 100) * zoomLevel, (height || 20) * zoomLevel);
        break;
        
      case 'arrow':
        ctx.strokeStyle = color || '#000';
        ctx.lineWidth = 2 * zoomLevel;
        drawArrow(ctx, x * zoomLevel, y * zoomLevel, (x + (width || 100)) * zoomLevel, (y + (height || 100)) * zoomLevel);
        break;
        
      case 'signature':
      case 'image':
        if (image_data) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, x * zoomLevel, y * zoomLevel, (width || 200) * zoomLevel, (height || 100) * zoomLevel);
          };
          img.src = image_data;
        }
        break;
    }
    
    ctx.restore();
  };

  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    const headlen = 10 * zoomLevel;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const getCanvasCoordinates = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / zoomLevel,
      y: (event.clientY - rect.top) / zoomLevel
    };
  };

  const handleMouseDown = (event) => {
    if (selectedTool === 'select') return;

    const point = getCanvasCoordinates(event);
    setStartPoint(point);
    setIsDrawing(true);

    if (selectedTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        onAddAnnotation({
          type: 'text',
          x: point.x,
          y: point.y,
          text: text,
          font_size: 14,
          color: '#000'
        });
      }
      setIsDrawing(false);
    }
  };

  const handleMouseMove = (event) => {
    if (!isDrawing || !startPoint) return;

    const point = getCanvasCoordinates(event);
    
    if (['rectangle', 'circle', 'highlight', 'arrow'].includes(selectedTool)) {
      const annotation = {
        type: selectedTool,
        x: Math.min(startPoint.x, point.x),
        y: Math.min(startPoint.y, point.y),
        width: Math.abs(point.x - startPoint.x),
        height: Math.abs(point.y - startPoint.y),
        color: selectedTool === 'highlight' ? 'rgba(255, 255, 0, 0.3)' : '#000'
      };
      setCurrentAnnotation(annotation);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) {
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentAnnotation(null);
      return;
    }

    if (currentAnnotation.width > 5 && currentAnnotation.height > 5) {
      onAddAnnotation(currentAnnotation);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentAnnotation(null);
  };

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-gray-500">No PDF loaded</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8 min-h-full">
      <Card className="shadow-lg">
        <canvas
          ref={canvasRef}
          className="cursor-crosshair border border-gray-300"
          style={{ maxWidth: '100%', height: 'auto' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </Card>
    </div>
  );
};

export default PDFViewer;