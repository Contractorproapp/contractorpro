import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function MobileBack() {
  const location = useLocation()
  const navigate = useNavigate()

  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup') return null

  return (
    <button
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
      className="lg:hidden fixed top-3 left-4 z-50 text-gray-400 hover:text-gray-700"
      aria-label="Back"
    >
      <ArrowLeft size={20} />
    </button>
  )
}
