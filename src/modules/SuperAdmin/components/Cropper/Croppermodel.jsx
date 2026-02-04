 import React, { useEffect, useRef, useState } from "react";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

/**
 * CropperModal – version-safe (v1 + v2)
 */
const CropperModal = ({
  open,
  image,
  onCrop,
  onClose,
  aspectRatio = 1,
}) => {
  const imgRef = useRef(null);
  const cropperRef = useRef(null);

  const [zoom, setZoom] = useState(1);

  /* ================= INIT ================= */
  useEffect(() => {
    if (!open || !imgRef.current) return;

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
  }, [open, aspectRatio]);

  /* ================= HELPERS ================= */

  // ✅ Custom getCroppedCanvas (v2 fallback)
  const getSafeCroppedCanvas = (cropper, size = 400) => {
    if (typeof cropper.getCroppedCanvas === "function") {
      return cropper.getCroppedCanvas({
        width: size,
        height: size,
        imageSmoothingQuality: "high",
      });
    }

    // ---- v2 fallback ----
    const data = cropper.getData(true);
    const image = cropper.image || cropper.element;

    if (!image) return null;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    const scaleX = image.naturalWidth / cropper.getImageData().naturalWidth;
    const scaleY = image.naturalHeight / cropper.getImageData().naturalHeight;

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
    const cropper = cropperRef.current;
    if (!cropper) return;

    const canvas = getSafeCroppedCanvas(cropper, 400);
    if (!canvas) return;

    onCrop(canvas.toDataURL("image/png"));
    onClose();
  };

  // ✅ Zoom – delta based (v1 + v2 safe)
  const zoomImage = (value) => {
    const cropper = cropperRef.current;
    if (!cropper) return;

    cropper.zoom(value - zoom);
    setZoom(value);
  };

  const rotateLeft = () => cropperRef.current?.rotate(-90);
  const rotateRight = () => cropperRef.current?.rotate(90);

  const reset = () => {
    const cropper = cropperRef.current;
    if (!cropper) return;

    cropper.reset();
    setZoom(1);
  };

  const setSquare = () => cropperRef.current?.setAspectRatio(1);

  // ✅ v2-safe unlock
  const setFree = () => cropperRef.current?.setAspectRatio(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-999">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
            Edit Profile Photo
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-xl"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="grid grid-cols-12 gap-6 p-6">

          {/* CROP AREA */}
          <div className="col-span-12 md:col-span-9">
            <div className="w-full h-[420px] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
              <img
                ref={imgRef}
                src={image}
                className="max-w-full block"
                alt="Crop"
              />
            </div>
          </div>

          {/* TOOLS */}
          <div className="col-span-12 md:col-span-3 space-y-5">

            {/* Zoom */}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Zoom
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => zoomImage(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Rotate */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={rotateLeft}
                className="flex-1 px-3 py-2 rounded-md border text-sm"
              >
                ⟲ Rotate
              </button>
              <button
                type="button"
                onClick={rotateRight}
                className="flex-1 px-3 py-2 rounded-md border text-sm"
              >
                ⟳ Rotate
              </button>
            </div>

            {/* Aspect Ratio */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={setSquare}
                className="flex-1 px-3 py-2 rounded-md border text-sm"
              >
                Square
              </button>
              <button
                type="button"
                onClick={setFree}
                className="flex-1 px-3 py-2 rounded-md border text-sm"
              >
                Free
              </button>
            </div>

            {/* Reset */}
            <button
              type="button"
              onClick={reset}
              className="w-full px-3 py-2 rounded-md border text-sm"
            >
              Reset
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-md border text-sm"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCrop}
            className="px-6 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium"
          >
            Crop & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropperModal;
