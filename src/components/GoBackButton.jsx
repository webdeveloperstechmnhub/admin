import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const buttonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.55rem',
  borderRadius: '999px',
  padding: '0.7rem 1rem',
  border: '1px solid rgba(255, 215, 0, 0.28)',
  background: 'rgba(17, 17, 17, 0.78)',
  color: '#ffd700',
  textDecoration: 'none',
  fontWeight: 700,
  letterSpacing: '0.01em',
  boxShadow: '0 10px 24px rgba(0, 0, 0, 0.16)',
  backdropFilter: 'blur(10px)',
}

const hoverTransition = {
  type: 'spring',
  stiffness: 360,
  damping: 22,
  mass: 0.7,
}

const sharedMotion = {
  whileHover: { y: -2, scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: hoverTransition,
}

const GoBackButton = ({ to, onClick, label = 'Back', className = '' }) => {
  const content = (
    <>
      <ArrowLeft size={16} />
      <span>{label}</span>
    </>
  )

  if (to) {
    const MotionLink = motion(Link)
    return (
      <MotionLink to={to} className={className} style={buttonStyle} {...sharedMotion}>
        {content}
      </MotionLink>
    )
  }

  return (
    <motion.button type="button" onClick={onClick} className={className} style={buttonStyle} {...sharedMotion}>
      {content}
    </motion.button>
  )
}

export default GoBackButton