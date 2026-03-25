'use client';
import Image from 'next/image';
import { 
  TruckIcon, 
  MapPinIcon, 
  ArchiveBoxIcon 
} from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import '@/styles/AuthLayout.css';

export default function AuthLayout({ children }) {
  return (
    <div className="auth-container">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="auth-left">
        <div className="brand-header">
          <div className="logo-box-sm">
            {/* Logo Image instead of Icon */}
            <Image 
              src="/local-miles.jpg" 
              alt="Logo" 
              width={24} 
              height={24} 
              className="logo-img-sm"
            />
          </div>
          <span className="brand-text">Local Miles</span>
        </div>

        <div className="hero-content">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="hero-graphic"
          >
            {/* Center Logo Graphic */}
            <div className="graphic-circle"></div>
            <div className="main-logo-wrapper">
              <Image 
                src="/local-miles.jpg" 
                alt="Local Miles" 
                width={120} 
                height={120} 
                className="graphic-logo"
              />
            </div>
            
            {/* Floating Icons instead of Emojis */}
            <div className="graphic-float float-1">
              <MapPinIcon className="float-icon" />
            </div>
            <div className="graphic-float float-2">
              <ArchiveBoxIcon className="float-icon" />
            </div>
          </motion.div>

          <div className="hero-text">
            <h2>Unified Logistics SaaS</h2>
            <p>The professional community platform for modern senders and urban couriers.</p>
          </div>
        </div>

        <div className="quote-footer">
          "Powering the next generation of city logistics."
        </div>
      </div>

      {/* Right Panel - Form Content */}
      <div className="auth-right">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="auth-content-box"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}


// src/app/(auth)/layout.jsx
// 'use client';
// import { TruckIcon } from '@heroicons/react/24/solid';
// import { motion } from 'framer-motion';
// import '@/styles/AuthLayout.css'; // We'll create this CSS file

// export default function AuthLayout({ children }) {
//   return (
//     <div className="auth-container">
//       {/* Left Panel - Branding (Hidden on mobile) */}
//       <div className="auth-left">
//         <div className="brand-header">
//           <div className="logo-box-sm">
//             <TruckIcon className="icon-sm" />
//           </div>
//           <span className="brand-text">Local Miles</span>
//         </div>

//         <div className="hero-content">
//           <motion.div 
//             initial={{ opacity: 0, scale: 0.9 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.8 }}
//             className="hero-graphic"
//           >
//             {/* Abstract Graphic / Icon Representation */}
//             <div className="graphic-circle"></div>
//             <TruckIcon className="graphic-icon" />
//             <div className="graphic-float float-1">📍</div>
//             <div className="graphic-float float-2">📦</div>
//           </motion.div>

//           <div className="hero-text">
//             <h2>Unified Logistics SaaS</h2>
//             <p>The professional community platform for modern senders and urban couriers.</p>
//           </div>
//         </div>

//         <div className="quote-footer">
//           "Powering the next generation of city logistics."
//         </div>
//       </div>

//       {/* Right Panel - Form Content */}
//       <div className="auth-right">
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.2 }}
//           className="auth-content-box"
//         >
//           {children}
//         </motion.div>
//       </div>
//     </div>
//   );
// }