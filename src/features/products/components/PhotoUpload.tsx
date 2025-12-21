import { useState, useCallback } from 'react';
import { Upload, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { uploadProductPhoto, deleteProductPhoto } from '../services/products.service';
import type { ProductImage } from '@/types/database';

interface PhotoUploadProps {
  productId?: string;
  onPhotosChange?: (photos: ProductImage[]) => void;
  existingPhotos?: ProductImage[];
  disabled?: boolean;
  onPreviewFiles?: (files: File[]) => void;
  previewFiles?: File[];
}

export function PhotoUpload({
  productId,
  onPhotosChange,
  existingPhotos = [],
  disabled = false,
  onPreviewFiles,
  previewFiles = [],
}: PhotoUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; preview: string }[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<ProductImage[]>(existingPhotos);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.currentTarget.files;
      if (!files) return;

      const newPreviews = Array.from(files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      const newPreviewFiles = Array.from(files);
      setPreviews(prev => [...prev, ...newPreviews]);
      onPreviewFiles?.([...previewFiles, ...newPreviewFiles]);
    },
    [previewFiles, onPreviewFiles]
  );

  const handleUpload = async () => {
    if (!productId || previews.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please save the product first, then add photos.',
      });
      return;
    }

    setUploading(true);
    try {
      const uploadedPhotosResult = await Promise.all(
        previews.map(({ file }) => uploadProductPhoto(productId, file, user?.id))
      );

      const successfulUploads = uploadedPhotosResult.filter(result => result.data);
      if (successfulUploads.length > 0) {
        const newPhotos = successfulUploads.map(result => result.data!);
        const allPhotos = [...uploadedPhotos, ...newPhotos];
        setUploadedPhotos(allPhotos);
        onPhotosChange?.(allPhotos);

        // Clean up previews
        previews.forEach(({ preview }) => URL.revokeObjectURL(preview));
        setPreviews([]);

        toast({
          title: 'Success',
          description: `${successfulUploads.length} photo(s) uploaded successfully.`,
        });
      }

      // Handle failed uploads
      const failedUploads = uploadedPhotosResult.filter(result => result.error);
      if (failedUploads.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Partial Upload',
          description: `${failedUploads.length} photo(s) failed to upload. Please try again.`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to upload photos. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePreview = (index: number) => {
    setPreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].preview);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const result = await deleteProductPhoto(photoId, user?.id);
      if (result.error) throw result.error;

      const updatedPhotos = uploadedPhotos.filter(photo => photo.id !== photoId);
      setUploadedPhotos(updatedPhotos);
      onPhotosChange?.(updatedPhotos);

      toast({
        title: 'Photo deleted',
        description: 'The photo has been removed.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete photo.',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Product Photos</label>

        {/* Upload area */}
        <div className="border-2 border-dashed rounded-lg p-6 bg-muted/30 hover:bg-muted/50 transition">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
            id="photo-input"
          />
          <label htmlFor="photo-input" className="cursor-pointer block">
            <div className="flex flex-col items-center gap-2 text-center">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-sm font-medium">Click to upload photos</div>
              <div className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</div>
            </div>
          </label>
        </div>

        {/* Preview of new photos */}
        {previews.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">New Photos ({previews.length})</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {previews.map((item, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={item.preview}
                    alt={`Preview ${index}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleRemovePreview(index)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading || disabled}
              className="mt-4 w-full"
            >
              {uploading ? 'Uploading...' : `Upload ${previews.length} Photo(s)`}
            </Button>
          </div>
        )}

        {/* Uploaded photos */}
        {uploadedPhotos.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Uploaded Photos ({uploadedPhotos.length})
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {uploadedPhotos.map(photo => (
                <div key={photo.id} className="relative aspect-square">
                  <img
                    src={photo.file_url}
                    alt="Product"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {photo.is_primary && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Primary
                    </div>
                  )}
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!productId && previews.length === 0 && uploadedPhotos.length === 0 && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You can select photos now. They will be uploaded after the product is saved.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
