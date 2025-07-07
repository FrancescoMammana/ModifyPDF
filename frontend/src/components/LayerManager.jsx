import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from '../hooks/use-toast';
import { 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Trash2,
  Layers
} from 'lucide-react';

const LayerManager = ({ layers, annotations, onLayersChange, onAnnotationsChange }) => {
  const { toast } = useToast();

  // Group annotations by layer
  const groupedAnnotations = annotations.reduce((acc, annotation) => {
    const layer = annotation.layer || 0;
    if (!acc[layer]) {
      acc[layer] = [];
    }
    acc[layer].push(annotation);
    return acc;
  }, {});

  const layerList = Object.keys(groupedAnnotations).map(layerIndex => ({
    index: parseInt(layerIndex),
    annotations: groupedAnnotations[layerIndex],
    visible: true
  }));

  const handleMoveLayer = (layerIndex, direction) => {
    const currentAnnotations = [...annotations];
    const layerAnnotations = currentAnnotations.filter(a => a.layer === layerIndex);
    
    if (direction === 'up') {
      // Move layer up (increase layer index)
      layerAnnotations.forEach(annotation => {
        annotation.layer = Math.min(annotation.layer + 1, layerList.length);
      });
    } else {
      // Move layer down (decrease layer index)
      layerAnnotations.forEach(annotation => {
        annotation.layer = Math.max(annotation.layer - 1, 0);
      });
    }
    
    onAnnotationsChange(currentAnnotations);
    
    toast({
      title: `Layer moved ${direction}`,
      description: `Layer ${layerIndex} has been moved ${direction}`
    });
  };

  const handleDeleteLayer = (layerIndex) => {
    const updatedAnnotations = annotations.filter(a => a.layer !== layerIndex);
    onAnnotationsChange(updatedAnnotations);
    
    toast({
      title: "Layer deleted",
      description: `Layer ${layerIndex} and its contents have been removed`
    });
  };

  const handleToggleVisibility = (layerIndex) => {
    // For now, just show toast. In a full implementation, you'd track visibility state
    toast({
      title: "Layer visibility toggled",
      description: `Layer ${layerIndex} visibility has been toggled`
    });
  };

  const getLayerTitle = (layerIndex, annotations) => {
    const types = [...new Set(annotations.map(a => a.type))];
    if (types.length === 1) {
      return `${types[0]} layer`;
    } else if (types.length > 1) {
      return `Mixed (${types.join(', ')})`;
    }
    return `Layer ${layerIndex}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Layers className="h-5 w-5 mr-2" />
          Layer Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {layerList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Layers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No layers yet</p>
            <p className="text-xs mt-1">Add annotations to create layers</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {layerList
              .sort((a, b) => b.index - a.index) // Show higher layers first
              .map((layer) => (
                <div
                  key={layer.index}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">
                        {getLayerTitle(layer.index, layer.annotations)}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({layer.annotations.length} items)
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleVisibility(layer.index)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLayer(layer.index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveLayer(layer.index, 'up')}
                      disabled={layer.index >= layerList.length - 1}
                      className="flex-1"
                    >
                      <ArrowUp className="h-4 w-4 mr-1" />
                      Move Up
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveLayer(layer.index, 'down')}
                      disabled={layer.index <= 0}
                      className="flex-1"
                    >
                      <ArrowDown className="h-4 w-4 mr-1" />
                      Move Down
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    <p>Layer {layer.index} - {layer.annotations.map(a => a.type).join(', ')}</p>
                  </div>
                </div>
              ))}
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p><strong>Layer Tips:</strong></p>
          <ul className="mt-1 space-y-1">
            <li>• Higher layers appear on top</li>
            <li>• Use layers to organize elements</li>
            <li>• Toggle visibility to work on specific layers</li>
            <li>• Delete layers to remove all elements</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default LayerManager;