import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { 
  MousePointer, 
  Type, 
  Highlighter, 
  Square, 
  Circle, 
  ArrowRight,
  Image,
  Edit3
} from 'lucide-react';

const ToolPanel = ({ selectedTool, onToolSelect, onAddAnnotation }) => {
  const tools = [
    { id: 'select', label: 'Select', icon: MousePointer, description: 'Select and move objects' },
    { id: 'text', label: 'Text', icon: Type, description: 'Add text annotations' },
    { id: 'highlight', label: 'Highlight', icon: Highlighter, description: 'Highlight text' },
    { id: 'rectangle', label: 'Rectangle', icon: Square, description: 'Draw rectangles' },
    { id: 'circle', label: 'Circle', icon: Circle, description: 'Draw circles' },
    { id: 'arrow', label: 'Arrow', icon: ArrowRight, description: 'Draw arrows' },
    { id: 'image', label: 'Image', icon: Image, description: 'Insert images' },
    { id: 'freehand', label: 'Draw', icon: Edit3, description: 'Free hand drawing' }
  ];

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (PNG, JPEG, SVG, or GIF)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        onAddAnnotation({
          type: 'image',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          imageData: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Editing Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? 'default' : 'outline'}
                className="flex flex-col items-center p-3 h-auto"
                onClick={() => {
                  if (tool.id === 'image') {
                    document.getElementById('image-upload').click();
                  } else {
                    onToolSelect(tool.id);
                  }
                }}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{tool.label}</span>
              </Button>
            );
          })}
        </div>

        <input
          id="image-upload"
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/gif"
          onChange={handleImageUpload}
          className="hidden"
        />

        <Separator />

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Tool Options</h4>
          {selectedTool === 'text' && (
            <div className="space-y-2">
              <label className="text-xs text-gray-600">Font Size</label>
              <select className="w-full p-2 border rounded text-sm">
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
                <option value="20">20px</option>
              </select>
            </div>
          )}
          
          {['rectangle', 'circle', 'arrow', 'highlight'].includes(selectedTool) && (
            <div className="space-y-2">
              <label className="text-xs text-gray-600">Color</label>
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-black rounded border-2 border-gray-300 cursor-pointer"></div>
                <div className="w-8 h-8 bg-red-500 rounded border-2 border-gray-300 cursor-pointer"></div>
                <div className="w-8 h-8 bg-blue-500 rounded border-2 border-gray-300 cursor-pointer"></div>
                <div className="w-8 h-8 bg-green-500 rounded border-2 border-gray-300 cursor-pointer"></div>
                <div className="w-8 h-8 bg-yellow-400 rounded border-2 border-gray-300 cursor-pointer"></div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="text-xs text-gray-500">
          <p><strong>Tips:</strong></p>
          <ul className="mt-1 space-y-1">
            <li>• Click and drag to create shapes</li>
            <li>• Use text tool to add annotations</li>
            <li>• Upload images for signatures</li>
            <li>• Use layers to organize elements</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ToolPanel;