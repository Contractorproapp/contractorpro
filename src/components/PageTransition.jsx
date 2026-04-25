import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

/**
 * Subtle fade + slide-up on route change. Respects reduced motion via
 * the global CSS rule in index.css (transitions clamped to 0.01ms).
 */
export default function PageTransition({ children }) {
  const location = useLocation()
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}
