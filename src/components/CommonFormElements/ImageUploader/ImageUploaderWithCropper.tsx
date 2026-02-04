"use client";

import { useEffect, useRef, useState } from "react";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import { FaUserCircle, FaPencilAlt, FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";

/* =========================================================
   PROPS
========================================================= */

interface ImageUploaderWithCropperProps {
  imageUrl?: string;
  previewImage?: string;
  loading?: boolean;
  aspectRatio?: number;
  onCrop: (base64: string) => void;
  onDelete: () => void;
  onViewImage?: () => void;
  viewTitle?: string;
}

/* =========================================================
   COMPONENT
========================================================= */

const ImageUploaderWithCropper = ({
  imageUrl,
  previewImage,
  loading = false,
  aspectRatio = 1,
  onCrop,
  onDelete,
  onViewImage,
  viewTitle = "Click to view image",
}: ImageUploaderWithCropperProps) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const cropperRef = useRef<Cropper | null>(null);

  const [rawImage, setRawImage] = useState<string>("");
  const [showCropper, setShowCropper] = useState(false);
  const [zoom, setZoom] = useState(1);

  /* ================= FILE SELECT ================= */

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire("Too large", "Image must be under 2MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be selected again if deleted
    e.target.value = "";
  };

  /* ================= INIT CROPPER ================= */

  useEffect(() => {
    if (!showCropper || !imgRef.current) return;

    cropperRef.current = new Cropper(imgRef.current, {
      aspectRatio,
      viewMode: 1,
      dragMode: "move",
      autoCropArea: 1,
      responsive: true,
      background: false,
      zoomOnWheel: true,
      ready() {
        setZoom(1);
      },
    });

    return () => {
      cropperRef.current?.destroy();
      cropperRef.current = null;
    };
  }, [showCropper, aspectRatio]);

  /* ================= HELPERS (VERSION SAFE) ================= */

  const getSafeCroppedCanvas = (cropper: Cropper, size = 400) => {
    // Standard v1 approach
    if (typeof cropper.getCroppedCanvas === "function") {
      return cropper.getCroppedCanvas({
        width: size,
        height: size,
        imageSmoothingQuality: "high",
      });
    }

    // v2 Fallback logic
    const data = cropper.getData(true);
    const image = (cropper as any).image || (cropper as any).element;
    if (!image) return null;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const imageData = cropper.getImageData();
    const scaleX = image.naturalWidth / imageData.naturalWidth;
    const scaleY = image.naturalHeight / imageData.naturalHeight;

    ctx.drawImage(
      image,
      data.x * scaleX,
      data.y * scaleY,
      data.width * scaleX,
      data.height * scaleY,
      0,
      0,
      size,
      size
    );
    return canvas;
  };

  /* ================= ACTIONS ================= */

  const handleCrop = () => {
    if (!cropperRef.current) return;
    const canvas = getSafeCroppedCanvas(cropperRef.current, 400);
    if (!canvas) return;

    onCrop(canvas.toDataURL("image/png"));
    setShowCropper(false);
  };

  const zoomImage = (value: number) => {
    if (!cropperRef.current) return;
    cropperRef.current.zoom(value - zoom);
    setZoom(value);
  };

  const rotateLeft = () => cropperRef.current?.rotate(-90);
  const rotateRight = () => cropperRef.current?.rotate(90);
  const reset = () => {
    cropperRef.current?.reset();
    setZoom(1);
  };
  const setSquare = () => cropperRef.current?.setAspectRatio(1);
  const setFree = () => cropperRef.current?.setAspectRatio(NaN);

  const confirmDelete = async () => {
    const res = await Swal.fire({
      title: "Remove image?",
      text: "Are you sure you want to remove this image?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, remove",
    });
    if (res.isConfirmed) onDelete();
  };

  /* ================= RENDER ================= */

  return (
    <>
      {/* IMAGE PREVIEW CIRCLE/SQUARE */}
      <div className="w-full md:w-auto flex justify-center md:justify-start">
        <div className="relative w-36 h-36">
          <div className="w-full h-full rounded-xl border-4 border-white dark:border-gray-700 shadow-md overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center relative">
            {imageUrl ? (
              <img
                src={imageUrl}
                onClick={onViewImage}
                title={viewTitle}
                className="w-full h-full object-cover cursor-pointer"
                alt="Profile"
              />
            ) : previewImage ? (
              <img src={previewImage} className="w-full h-full object-cover" alt="Preview" />
            ) : (
              <FaUserCircle className="text-7xl text-gray-400" />
            )}

            {loading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {!loading && (
            <>
              <label className="absolute -top-3 -right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-600 dark:text-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <FaPencilAlt size={14} />
                <input hidden type="file" accept="image/*" onChange={onFileSelect} />
              </label>

              {(imageUrl || previewImage) && (
                <button
                  onClick={confirmDelete}
                  className="absolute -bottom-3 -right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-600 rounded-full shadow-lg text-red-500 hover:bg-red-50 transition-colors"
                >
                  <FaTimes size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ================= CROPPER MODAL ================= */}
      {showCropper && (
        <div className="fixed inset-0 bg-black/70 z-[999] flex items-center justify-center p-4 md:p-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                Edit Profile Photo
              </h3>
              <button
                type="button"
                onClick={() => setShowCropper(false)}
                className="text-gray-500 hover:text-red-500 transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="grid grid-cols-12 gap-6 p-6">
              {/* CROP AREA */}
              <div className="col-span-12 md:col-span-9">
                <div className="w-full h-[300px] md:h-[420px] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                  <img
                    ref={imgRef}
                    src={rawImage}
                    className="max-w-full block"
                    alt="Source"
                  />
                </div>
              </div>

              {/* TOOLS */}
              <div className="col-span-12 md:col-span-3 space-y-5">
                {/* Zoom */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">
                    Zoom
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.01"
                    value={zoom}
                    onChange={(e) => zoomImage(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                {/* Rotate Controls */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={rotateLeft}
                    className="flex-1 px-3 py-2 rounded-md border dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm transition-colors"
                  >
                    ⟲ Rotate
                  </button>
                  <button
                    type="button"
                    onClick={rotateRight}
                    className="flex-1 px-3 py-2 rounded-md border dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm transition-colors"
                  >
                    ⟳ Rotate
                  </button>
                </div>

                {/* Aspect Ratio Controls */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={setSquare}
                    className="flex-1 px-3 py-2 rounded-md border dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm transition-colors"
                  >
                    Square
                  </button>
                  <button
                    type="button"
                    onClick={setFree}
                    className="flex-1 px-3 py-2 rounded-md border dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm transition-colors"
                  >
                    Free
                  </button>
                </div>

                {/* Reset */}
                <button
                  type="button"
                  onClick={reset}
                  className="w-full px-3 py-2 rounded-md border dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={() => setShowCropper(false)}
                className="px-5 py-2 rounded-md border dark:border-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 text-sm font-medium transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCrop}
                className="px-6 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors"
              >
                Crop & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageUploaderWithCropper;