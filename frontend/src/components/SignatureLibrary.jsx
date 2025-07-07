import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useToast } from '../hooks/use-toast';
import { Upload, Trash2, Plus, Download } from 'lucide-react';

const SignatureLibrary = ({ signatures, onSignaturesChange, onAddSignature }) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleSignatureUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file (PNG, JPEG, SVG, or GIF)",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newSignature = {
          id: Date.now(),
          name: file.name.replace(/\.[^/.]+$/, ""),
          imageData: e.target.result,
          dateAdded: new Date().toISOString()
        };

        const updatedSignatures = [...signatures, newSignature];
        onSignaturesChange(updatedSignatures);
        localStorage.setItem('pdfEditor_signatures', JSON.stringify(updatedSignatures));
        
        toast({
          title: "Signature added",
          description: `${newSignature.name} has been saved to your library`
        });
        
        setIsUploadDialogOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteSignature = (signatureId) => {
    const updatedSignatures = signatures.filter(sig => sig.id !== signatureId);
    onSignaturesChange(updatedSignatures);
    localStorage.setItem('pdfEditor_signatures', JSON.stringify(updatedSignatures));
    
    toast({
      title: "Signature deleted",
      description: "Signature has been removed from your library"
    });
  };

  const handleUseSignature = (signature) => {
    onAddSignature({
      type: 'signature',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      imageData: signature.imageData
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
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSignatures = JSON.parse(e.target.result);
          if (Array.isArray(importedSignatures)) {
            const updatedSignatures = [...signatures, ...importedSignatures];
            onSignaturesChange(updatedSignatures);
            localStorage.setItem('pdfEditor_signatures', JSON.stringify(updatedSignatures));
            
            toast({
              title: "Signatures imported",
              description: `${importedSignatures.length} signatures have been imported`
            });
          }
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Invalid signature file format",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
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
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Signature Image
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
                    src={signature.imageData}
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
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignatureLibrary;