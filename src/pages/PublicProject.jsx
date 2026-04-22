import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, Hammer, FileText, AlertTriangle, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'

const STATUS_COLORS = {
  Planning:'bg-gray-100 text-gray-600', 'In Progress':'bg-blue-100 text-blue-700',
  Punch_List:'bg-yellow-100 text-yellow-700', Complete:'bg-green-100 text-green-700', 'On Hold':'bg-orange-100 text-orange-700',
}

export default function PublicProject() {
  const { token } = useParams()
  const [project, setProject]   = useState(null)
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: proj } = await supabase
        .from('projects')
        .select('*')
        .eq('public_token', token)
        .single()

      if (!proj) { setNotFound(true); setLoading(false); return }
      setProject(proj)

      const { data: prof } = await supabase
        .from('profiles')
        .select('business_name, phone, email, logo_url')
        .eq('id', proj.user_id)
        .single()
      setProfile(prof)
      setLoading(false)
    }
    load()
  }, [token])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center text-center p-4">
      <div>
        <p className="text-2xl font-bold text-gray-700">Project not found</p>
        <p className="text-gray-400 mt-2">This link may be invalid or expired.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex justify-end print:hidden">
          <button onClick={() => window.print()} className="btn-secondary">
            <Download size={15} /> Download PDF
          </button>
        </div>
        {/* Header */}
        <div className="card p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {profile?.logo_url
              ? <img src={profile.logo_url} alt="Logo" className="w-14 h-14 rounded-xl object-cover" />
              : <div className="w-14 h-14 bg-brand-500 rounded-xl flex items-center justify-center"><Hammer size={24} className="text-white" /></div>
            }
            <div>
              <h1 className="text-xl font-bold">{profile?.business_name || 'Contractor'}</h1>
              {profile?.phone && <p className="text-sm text-gray-500">{profile.phone}</p>}
            </div>
          </div>
          <span className={`badge mt-1 ${STATUS_COLORS[project.status] || STATUS_COLORS.Planning}`}>{project.status}</span>
        </div>

        {/* Project Info */}
        <div className="card p-6 space-y-2">
          <h2 className="text-lg font-bold">{project.name}</h2>
          {project.client  && <p className="text-sm text-gray-600">Client: <strong>{project.client}</strong></p>}
          {project.address && <p className="text-sm text-gray-600">Address: {project.address}</p>}
          {project.start_date && <p className="text-sm text-gray-600">Start: {project.start_date}{project.end_date ? ` · Est. End: ${project.end_date}` : ''}</p>}
          {project.description && <p className="text-sm text-gray-700 mt-2 pt-2 border-t border-gray-100">{project.description}</p>}
        </div>

        {/* Field Notes */}
        {(project.notes||[]).length > 0 && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={15} className="text-gray-400" />
              <h3 className="font-semibold text-gray-700">Field Notes</h3>
            </div>
            <div className="space-y-2">
              {(project.notes||[]).map(note => (
                <div key={note.id} className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-sm text-gray-700">{note.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{note.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change Orders */}
        {(project.change_orders||[]).length > 0 && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-yellow-500" />
              <h3 className="font-semibold text-gray-700">Change Orders</h3>
            </div>
            <div className="space-y-2">
              {(project.change_orders||[]).map(co => (
                <div key={co.id} className="flex items-start justify-between gap-3 bg-yellow-50 rounded-lg px-3 py-2">
                  <div><p className="text-sm text-gray-700">{co.text}</p><p className="text-xs text-gray-400">{co.date}</p></div>
                  <span className={`badge shrink-0 ${co.status==='Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{co.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">Powered by ContractorPro</p>
      </div>
    </div>
  )
}
