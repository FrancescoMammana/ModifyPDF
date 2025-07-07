import React, { useRef, useEffect, useState } from 'react';
import { Card } from './ui/card';

const PDFViewer = ({ 
  pdfData, 
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

  useEffect(() => {
    drawPDF();
  }, [pdfData, currentPage, zoomLevel, annotations]);

  const drawPDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 800 * zoomLevel;
    canvas.height = 1000 * zoomLevel;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw PDF page background (mock)
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw mock PDF content
    ctx.fillStyle = '#333';
    ctx.font = `${16 * zoomLevel}px Arial`;
    ctx.fillText(`PDF Page ${currentPage}`, 50 * zoomLevel, 50 * zoomLevel);
    
    // Draw some mock content lines
    for (let i = 0; i < 20; i++) {
      ctx.fillText(
        `This is line ${i + 1} of the PDF document content...`,
        50 * zoomLevel,
        (80 + i * 30) * zoomLevel
      );
    }

    // Draw annotations
    drawAnnotations(ctx);
  };

  const drawAnnotations = (ctx) => {
    annotations
      .filter(annotation => annotation.page === currentPage)
      .forEach(annotation => {
        drawAnnotation(ctx, annotation);
      });
  };

  const drawAnnotation = (ctx, annotation) => {
    const { type, x, y, width, height, color, text } = annotation;
    
    ctx.save();
    
    switch (type) {
      case 'text':
        ctx.fillStyle = color || '#000';
        ctx.font = `${(annotation.fontSize || 14) * zoomLevel}px Arial`;
        ctx.fillText(text || 'Text', x * zoomLevel, y * zoomLevel);
        break;
        
      case 'rectangle':
        ctx.strokeStyle = color || '#000';
        ctx.lineWidth = 2 * zoomLevel;
        ctx.strokeRect(x * zoomLevel, y * zoomLevel, width * zoomLevel, height * zoomLevel);
        break;
        
      case 'circle':
        ctx.strokeStyle = color || '#000';
        ctx.lineWidth = 2 * zoomLevel;
        ctx.beginPath();
        ctx.arc(
          (x + width / 2) * zoomLevel,
          (y + height / 2) * zoomLevel,
          (Math.min(width, height) / 2) * zoomLevel,
          0,
          2 * Math.PI
        );
        ctx.stroke();
        break;
        
      case 'highlight':
        ctx.fillStyle = color || 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(x * zoomLevel, y * zoomLevel, width * zoomLevel, height * zoomLevel);
        break;
        
      case 'arrow':
        ctx.strokeStyle = color || '#000';
        ctx.lineWidth = 2 * zoomLevel;
        drawArrow(ctx, x * zoomLevel, y * zoomLevel, (x + width) * zoomLevel, (y + height) * zoomLevel);
        break;
        
      case 'signature':
        if (annotation.imageData) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, x * zoomLevel, y * zoomLevel, width * zoomLevel, height * zoomLevel);
          };
          img.src = annotation.imageData;
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
          fontSize: 14,
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