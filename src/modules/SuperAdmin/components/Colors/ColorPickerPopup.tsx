
import { Dialog, DialogPanel, DialogBackdrop } from "@headlessui/react";
import ColorSelector from "./ColorSelector";

export default function ColorPickerPopup({
  open,
  setOpen,
  value,
  onChange,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <Dialog open={open} onClose={() => setOpen(false)} className="relative z-999">
      
      {/* BACKDROP identical */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity 
          data-[closed]:opacity-0 
          data-[enter]:duration-300 
          data-[leave]:duration-200 
          data-[enter]:ease-out 
          data-[leave]:ease-in"
      />

      {/* CENTERED PANEL identical */}
      <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">

          {/* PANEL EXACT SAME STYLE AS ADD EMPLOYEE */}
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white dark:bg-[#0c1427] 
              text-left shadow-xl transition-all
              data-[closed]:translate-y-4 
              data-[closed]:opacity-0 
              data-[enter]:duration-300 
              data-[leave]:duration-200 
              data-[enter]:ease-out 
              data-[leave]:ease-in 
              sm:my-8 sm:w-full sm:max-w-[450px]
              data-[closed]:sm:translate-y-0 
              data-[closed]:sm:scale-95"
          >

            {/* CARD WRAPPER */}
            <div className="trezo-card w-full bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md">

              {/* HEADER – EXACT MATCH */}
              <div
                className="trezo-card-header bg-gray-50 dark:bg-[#15203c] mb-[20px] md:mb-[25px]
                  flex items-center justify-between -mx-[20px] md:-mx-[25px] 
                  -mt-[20px] md:-mt-[25px] p-[20px] md:p-[25px] rounded-t-md"
              >
                <h5 className="!mb-0 text-[18px] font-medium text-black dark:text-white">
                  Select Icon Color
                </h5>

                <button
                  type="button"
                  className="text-[23px] transition-all leading-none text-black 
                    dark:text-white hover:text-primary-500"
                  onClick={() => setOpen(false)}
                >
                  <i className="ri-close-fill"></i>
                </button>
              </div>

              {/* COLOR SELECTOR */}
              <div className="mb-[20px] md:mb-[25px]">
                <ColorSelector value={value} onChange={onChange} />
              </div>

              {/* FOOTER BUTTON – MATCHED */}
              <div className="text-right">
                <button
                  type="button"
                  className="px-[26.5px] py-[12px] rounded-md bg-primary-500 
                    text-white hover:bg-primary-400"
                  onClick={() => setOpen(false)}
                >
                  Done
                </button>
              </div>

            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}


