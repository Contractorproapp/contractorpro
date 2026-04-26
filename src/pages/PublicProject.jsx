import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, FileText, AlertTriangle, Download, Camera, MapPin, Calendar as CalendarIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import PublicDocLayout, { DocSection } from '../components/PublicDocLayout'

const STATUS_BADGE = {
  Planning:       'bg-steel-200 text-steel-700',
  'In Progress':  'bg-brand-100 text-brand-700',
  Punch_List:     'bg-yellow-100 text-yellow-700',
  Complete:       'bg-green-100 text-green-700',
  'On Hold':      'bg-yellow-100 text-yellow-700',
}

export default function PublicProject() {
  const { token } = useParams()
  const [project, setProject]   = useState(null)
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: proj } = await supabase.rpc('get_public_project', { token_param: token })

      if (!proj) { setNotFound(true); setLoading(false); return }
      setProject(proj)

      const { data: profRows } = await supabase.rpc('get_public_profile', { uid: proj.user_id })
      setProfile(Array.isArray(profRows) ? profRows[0] : profRows)
      setLoading(false)
    }
    load()
  }, [token])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-steel-50">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center text-center p-4 bg-steel-50">
      <div>
        <p className="font-display font-bold text-2xl text-steel-700">Project not found</p>
        <p className="text-steel-500 mt-2">This link may be invalid or expired.</p>
      </div>
    </div>
  )

  const statusBadge = (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-tight ${STATUS_BADGE[project.status] || STATUS_BADGE.Planning}`}>
      {project.status?.replace('_', ' ')}
    </span>
  )

  const actions = (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-steel-700 border border-steel-200 font-semibold tracking-tight shadow-sm hover:bg-steel-100 transition-colors cursor-pointer"
    >
      <Download size={15} /> PDF
    </button>
  )

  const photos = project.photos || []
  const notes = project.notes || []
  const changeOrders = project.change_orders || []

  return (
    <PublicDocLayout
      profile={profile}
      docType="// Project"
      statusBadge={statusBadge}
      actions={actions}
    >
      {/* Project info */}
      <DocSection>
        <h2 className="font-display font-bold text-2xl text-steel-900 leading-tight">{project.name}</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
          {project.client && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] uppercase tracking-stamp text-steel-500 font-semibold w-20 shrink-0 mt-0.5">Client</span>
              <span className="text-sm font-medium text-steel-800">{project.client}</span>
            </div>
          )}
          {project.address && (
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-steel-500 mt-0.5 shrink-0" />
              <span className="text-sm text-steel-700">{project.address}</span>
            </div>
          )}
          {project.start_date && (
            <div className="flex items-start gap-2">
              <CalendarIcon size={13} className="text-steel-500 mt-0.5 shrink-0" />
              <span className="text-sm text-steel-700">
                {project.start_date}
                {project.end_date && <> · Est. End <strong>{project.end_date}</strong></>}
              </span>
            </div>
          )}
        </div>
        {project.description && (
          <p className="text-sm text-steel-700 leading-relaxed mt-4 pt-4 border-t border-steel-200 whitespace-pre-wrap">
            {project.description}
          </p>
        )}
      </DocSection>

      {/* Photos */}
      {photos.length > 0 && (
        <DocSection
          label={
            <span className="inline-flex items-center gap-1.5">
              <Camera size={11} /> Job Photos
            </span>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {photos.map(photo => (
              <a
                key={photo.url}
                href={photo.url}
                target="_blank"
                rel="noreferrer"
                className="group aspect-square rounded-lg overflow-hidden bg-steel-100 ring-1 ring-steel-200 hover:ring-brand-500 transition-all"
              >
                <img
                  src={photo.url}
                  alt=""
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        </DocSection>
      )}

      {/* Field Notes */}
      {notes.length > 0 && (
        <DocSection
          label={
            <span className="inline-flex items-center gap-1.5">
              <FileText size={11} /> Field Notes
            </span>
          }
        >
          <ul className="space-y-2">
            {notes.map(note => (
              <li key={note.id} className="bg-steel-50 rounded-lg px-3 py-2.5 border border-steel-100">
                <p className="text-sm text-steel-800 whitespace-pre-wrap">{note.text}</p>
                <p className="text-[10px] uppercase tracking-stamp text-steel-500 mt-1">{note.date}</p>
              </li>
            ))}
          </ul>
        </DocSection>
      )}

      {/* Change Orders */}
      {changeOrders.length > 0 && (
        <DocSection
          label={
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle size={11} className="text-yellow-600" /> Change Orders
            </span>
          }
        >
          <ul className="space-y-2">
            {changeOrders.map(co => (
              <li
                key={co.id}
                className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 border border-yellow-200 bg-yellow-50"
              >
                <div className="min-w-0">
                  <p className="text-sm text-steel-800 whitespace-pre-wrap">{co.text}</p>
                  <p className="text-[10px] uppercase tracking-stamp text-steel-500 mt-1">{co.date}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-tight ${
                  co.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-200 text-yellow-800'
                }`}>
                  {co.status}
                </span>
              </li>
            ))}
          </ul>
        </DocSection>
      )}
    </PublicDocLayout>
  )
}
