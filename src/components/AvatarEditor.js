import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNotification } from '@/system/services/NotificationRegistry';

export default function AvatarEditor({ currentAvatar, onSave, onClose }) {
  const { showNotification } = useNotification();
  const [selectedImage, setSelectedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!selectedImage) return;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = async () => {
        canvas.width = 200;
        canvas.height = 200;
        
        ctx.save();
        ctx.translate(100, 100);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.drawImage(img, -crop.width/2, -crop.height/2, crop.width, crop.height);
        ctx.restore();
        
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        
        try {
          await onSave(dataURL);
          showNotification('Avatar updated successfully!', 'success');
        } catch (error) {
          showNotification('Failed to update avatar. Please try again.', 'error');
          onClose();
        }
      };
      
      img.src = selectedImage;
    } catch (error) {
      showNotification('Error processing image. Please try again.', 'error');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 rounded-2xl p-6 w-96 border border-white/20 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Edit Avatar</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {!selectedImage ? (
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                {currentAvatar ? (
                  <img src={currentAvatar} alt="Current" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-4xl text-gray-400">📷</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Choose Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <div className="w-48 h-48 mx-auto bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    style={{
                      transform: `rotate(${rotation}deg) scale(${scale})`,
                      transformOrigin: 'center'
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Rotation</label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">{rotation}°</span>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Scale</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">{scale}x</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Change Image
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </div>
  );
}