import React from "react";

interface CropperModalProps {
  open: boolean;
  image: string;
  onCrop: (blob: Blob) => void;
  onClose: () => void;
  aspectRatio?: number;
}

declare const CropperModal: React.FC<CropperModalProps>;
export default CropperModal;
