import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import "../styles/introLogo.css";

const logoImage = "/images/logo.jpg";

export default function IntroLogo({ show, onFinish }) {
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      onFinish();
    }, 4200);

    return () => clearTimeout(timer);
  }, [show, onFinish]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="intro-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="intro-glow"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1.15, opacity: 1 }}
            exit={{ scale: 1.25, opacity: 0 }}
            transition={{ duration: 2.4, ease: "easeOut" }}
          />

          <motion.div
            className="intro-shine"
            initial={{ x: "-120%" }}
            animate={{ x: "240%" }}
            transition={{ delay: 1.2, duration: 1.6, ease: "easeInOut" }}
          />

          <div className="intro-content-wrap">
            <motion.div
              className="intro-content"
              initial={{ opacity: 0, scale: 0.92, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -10 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="intro-logo-box"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 1 }}
              >
                <motion.img
                  src={logoImage}
                  alt="CLOTHING STORE Logo"
                  className="intro-logo-image"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: [0.95, 1, 1.015, 1] }}
                  transition={{
                    delay: 0.4,
                    duration: 2.8,
                    times: [0, 0.35, 0.7, 1],
                    ease: "easeInOut",
                  }}
                  draggable={false}
                />
              </motion.div>

              <motion.p
                className="intro-welcome"
                initial={{ opacity: 0, letterSpacing: "0.2em", y: 8 }}
                animate={{ opacity: 1, letterSpacing: "0.55em", y: 0 }}
                transition={{ delay: 1.1, duration: 0.9 }}
              >
                WELCOME TO
              </motion.p>

              <motion.h1
                className="intro-title"
                initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 1.55, duration: 1 }}
              >
                CLOTHING STORE
              </motion.h1>

              <motion.div
                className="intro-line"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "220px", opacity: 1 }}
                transition={{ delay: 2.1, duration: 0.9 }}
              />

              <motion.p
                className="intro-subtitle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.45, duration: 0.8 }}
              >
                TIMELESS STYLE · MODERN WARDROBE
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}