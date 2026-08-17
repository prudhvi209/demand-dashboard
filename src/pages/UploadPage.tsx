import React from 'react';
import { motion } from 'framer-motion';
import { ExcelUploadZone } from '../components/upload/ExcelUploadZone';
import { pageVariants } from '../lib/animations';

export const UploadPage: React.FC = () => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="py-4"
    >
      <ExcelUploadZone />
    </motion.div>
  );
};
