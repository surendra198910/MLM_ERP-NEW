import React from "react";
import { motion } from "framer-motion";

const LineLoader = () => {
  return (
    <div className="w-full h-[3px] bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
      <motion.div
        className="h-full bg-primary-500"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
};

export default LineLoader;
