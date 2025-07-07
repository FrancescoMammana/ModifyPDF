import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useToast } from '../hooks/use-toast';
import { Upload, Trash2, Plus, Download } from 'lucide-react';
import ApiService from '../services/apiService';

const SignatureLibrary = ({ signatures, onSignaturesChange, onAddSignature }) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleSignatureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file (PNG, JPEG, SVG, or GIF)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const newSignature = await ApiService.createSignature(
            file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
            e.target.result, // base64 data
            file.type
          );

          const updatedSignatures = [...signatures, newSignature];
          onSignaturesChange(updatedSignatures);
          
          toast({
            title: "Signature added",
            description: `${newSignature.name} has been saved to your library`
          });
          
          setIsUploadDialogOpen(false);
        } catch (error) {
          console.error('Error creating signature:', error);
          toast({
            title: "Upload failed",
            description: "Failed to save signature. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to read file. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleDeleteSignature = async (signatureId) => {
    try {
      await ApiService.deleteSignature(signatureId);
      const updatedSignatures = signatures.filter(sig => sig.id !== signatureId);
      onSignaturesChange(updatedSignatures);
      
      toast({
        title: "Signature deleted",
        description: "Signature has been removed from your library"
      });
    } catch (error) {
      console.error('Error deleting signature:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete signature. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUseSignature = (signature) => {
    onAddSignature({
      type: 'signature',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      image_data: signature.image_data
    });
  };

  const handleExportSignatures = () => {
    const dataStr = JSON.stringify(signatures, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'pdf-editor-signatures.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Signatures exported",
      description: "Your signature library has been exported"
    });
  };

  const handleImportSignatures = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedSignatures = JSON.parse(e.target.result);
        if (Array.isArray(importedSignatures)) {
          // Import each signature to the backend
          let importedCount = 0;
          for (const sig of importedSignatures) {
            try {
              const newSignature = await ApiService.createSignature(
                sig.name,
                sig.image_data,
                sig.file_type
              );
              importedCount++;
            } catch (error) {
              console.error('Error importing signature:', error);
            }
          }
          
          // Reload signatures from backend
          const updatedSignatures = await ApiService.getSignatures();
          onSignaturesChange(updatedSignatures);
          
          toast({
            title: "Signatures imported",
            description: `${importedCount} signatures have been imported`
          });
        }
      } catch (error) {
        console.error('Error importing signatures:', error);
        toast({
          title: "Import failed",
          description: "Invalid signature file format",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Signature Library</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Signature</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isLoading ? 'Uploading...' : 'Upload Signature Image'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/gif"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Supported formats: PNG, JPEG, SVG, GIF
                </p>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSignatures}
            disabled={signatures.length === 0}
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('signature-import').click()}
          >
            <Upload className="h-4 w-4" />
          </Button>
          
          <input
            id="signature-import"
            type="file"
            accept=".json"
            onChange={handleImportSignatures}
            className="hidden"
          />
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {signatures.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No signatures in your library</p>
              <p className="text-xs mt-1">Upload signature images to get started</p>
            </div>
          ) : (
            signatures.map((signature) => (
              <div
                key={signature.id}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">
                    {signature.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSignature(signature.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="bg-gray-50 rounded p-2">
                  <img
                    src={signature.image_data}
                    alt={signature.name}
                    className="max-w-full h-12 object-contain mx-auto"
                  />
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseSignature(signature)}
                  className="w-full"
                >
                  Use Signature
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="text-xs text-gray-500">
          <p><strong>Tips:</strong></p>
          <ul className="mt-1 space-y-1">
            <li>• Upload transparent PNG files for best results</li>
            <li>• Keep signature images under 2MB</li>
            <li>• Export your library to backup signatures</li>
            <li>• Signatures are now saved to the database</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignatureLibrary;