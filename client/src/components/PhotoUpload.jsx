import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useFirestoreCollection, useFirestoreOperations } from "@/hooks/useFirestore";
import { useStorage } from "@/hooks/useStorage";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { orderBy, limit } from "firebase/firestore";
import { Upload, Image as ImageIcon, X, Download } from "lucide-react";


export const PhotoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { uploadFile } = useStorage();
  const { addDocument } = useFirestoreOperations("photoUploads");
  
  const { data: uploads, loading, error } = useFirestoreCollection(
    "photoUploads",
    [orderBy("uploadedAt", "desc"), limit(10)]
  );

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a valid image file`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 5MB limit`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const fileName = `photos/${Date.now()}-${file.name}`;
        const downloadURL = await uploadFile(file, fileName);
        
        return addDocument({
          fileName: file.name,
          originalName: file.name,
          downloadURL,
          fileSize: file.size,
          fileType: file.type,
          uploadedBy: user?.id || "anonymous",
          description: `Photo uploaded on ${new Date().toLocaleDateString()}`,
        });
      });

      await Promise.all(uploadPromises);
      
      toast({
        title: "Upload successful",
        description: `${selectedFiles.length} file(s) uploaded successfully`,
      });
      
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (fileType) => {
    if (fileType.includes('image')) return 'bg-blue-500';
    if (fileType.includes('pdf')) return 'bg-red-500';
    if (fileType.includes('document')) return 'bg-green-500';
    return 'bg-gray-500';
  };

  if (loading) {
    return (
      <Card className="border-gray-100 dark:border-gray-800">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Photo Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <LoadingSpinner className="h-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-100 dark:border-gray-800" data-testid="card-photo-upload">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          Photo Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Upload Area */}
        <div 
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          data-testid="upload-area"
        >
          <ImageIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Click to upload photos or drag and drop
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            PNG, JPG, GIF up to 5MB each
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="file-input"
          />
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Selected Files:</h4>
            {selectedFiles.map((file, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                data-testid={`selected-file-${index}`}
              >
                <div className="flex items-center space-x-3">
                  <ImageIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  data-testid={`remove-file-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button 
              onClick={handleUpload} 
              disabled={uploading}
              className="w-full"
              data-testid="button-upload"
            >
              {uploading ? <LoadingSpinner size="sm" /> : "Upload Files"}
            </Button>
          </div>
        )}

        {/* Recent Uploads */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Recent Uploads:</h4>
          {error && (
            <div className="text-red-500 text-sm" data-testid="text-uploads-error">
              Error loading uploads: {error}
            </div>
          )}
          {uploads.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400" data-testid="text-no-uploads">
              No uploads yet
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uploads.map((upload) => (
                <div 
                  key={upload.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  data-testid={`upload-item-${upload.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getFileTypeColor(upload.fileType)}`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{upload.originalName}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{formatFileSize(upload.fileSize)}</span>
                        <span>•</span>
                        <span>{upload.uploadedAt ? new Date(upload.uploadedAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {upload.fileType.split('/')[1]?.toUpperCase()}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(upload.downloadURL, '_blank')}
                      data-testid={`download-file-${upload.id}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};