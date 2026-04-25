import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus, FolderOpen, FileText, AlertTriangle, Trash2, ChevronDown, ChevronUp,
  Link as LinkIcon, Loader2, Camera, X, MapPin, Calendar as CalendarIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { cn } from '../lib/utils'

const STATUS_TONES = {
  Planning:      { bar: 'bg-steel-400',  badge: 'bg-muted text-muted-foreground' },
  'In Progress': { bar: 'bg-brand-500',  badge: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400' },
  Punch_List:    { bar: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400' },
  Complete:      { bar: 'bg-green-500',  badge: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' },
  'On Hold':     { bar: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400' },
}

const uid = () => Math.random().toString(36).slice(2)

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [fetching, setFetching] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [openId, setOpenId]     = useState(null)
  const [copied, setCopied]     = useState(null)
  const [form, setForm] = useState({
    name: '', client: '', address: '', start_date: '', end_date: '',
    status: 'Planning', description: '',
  })
  const [noteInputs, setNoteInputs]               = useState({})
  const [changeOrderInputs, setChangeOrderInputs] = useState({})
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowForm(true)
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setProjects(data || []); setFetching(false) })
  }, [user])

  const addProject = async () => {
    if (!form.name.trim()) return
    const { data } = await supabase.from('projects').insert({ user_id: user.id, ...form, notes: [], change_orders: [] }).select().single()
    if (data) {
      setProjects(prev => [data, ...prev])
      setForm({ name: '', client: '', address: '', start_date: '', end_date: '', status: 'Planning', description: '' })
      setShowForm(false)
    }
  }

  const deleteProject = async (id) => {
    await supabase.from('projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const updateStatus = async (id, status) => {
    await supabase.from('projects').update({ status }).eq('id', id)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  const addNote = async (id) => {
    const text = noteInputs[id]?.trim()
    if (!text) return
    const proj  = projects.find(p => p.id === id)
    const notes = [{ id: uid(), text, date: new Date().toLocaleString() }, ...(proj.notes || [])]
    await supabase.from('projects').update({ notes }).eq('id', id)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, notes } : p))
    setNoteInputs(ni => ({ ...ni, [id]: '' }))
  }

  const addChangeOrder = async (id) => {
    const text = changeOrderInputs[id]?.trim()
    if (!text) return
    const proj  = projects.find(p => p.id === id)
    const change_orders = [{ id: uid(), text, date: new Date().toLocaleDateString(), status: 'Pending' }, ...(proj.change_orders || [])]
    await supabase.from('projects').update({ change_orders }).eq('id', id)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, change_orders } : p))
    setChangeOrderInputs(co => ({ ...co, [id]: '' }))
  }

  const uploadPhoto = async (projId, file) => {
    if (!file) return
    const ext  = file.name.split('.').pop()
    const path = `${user.id}/${projId}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('project-photos').upload(path, file, { upsert: false })
    if (upErr) return
    const { data: pub } = supabase.storage.from('project-photos').getPublicUrl(path)
    const proj   = projects.find(p => p.id === projId)
    const photos = [...(proj.photos || []), { url: pub.publicUrl, path, uploaded_at: new Date().toISOString() }]
    await supabase.from('projects').update({ photos }).eq('id', projId)
    setProjects(prev => prev.map(p => p.id === projId ? { ...p, photos } : p))
  }

  const removePhoto = async (projId, photo) => {
    await supabase.storage.from('project-photos').remove([photo.path])
    const proj   = projects.find(p => p.id === projId)
    const photos = (proj.photos || []).filter(p => p.url !== photo.url)
    await supabase.from('projects').update({ photos }).eq('id', projId)
    setProjects(prev => prev.map(p => p.id === projId ? { ...p, photos } : p))
  }

  const toggleCOStatus = async (pid, coid) => {
    const proj = projects.find(p => p.id === pid)
    const change_orders = proj.change_orders.map(co =>
      co.id === coid ? { ...co, status: co.status === 'Pending' ? 'Approved' : 'Pending' } : co
    )
    await supabase.from('projects').update({ change_orders }).eq('id', pid)
    setProjects(prev => prev.map(p => p.id === pid ? { ...p, change_orders } : p))
  }

  const copyLink = (token) => {
    navigator.clipboard.writeText(`${window.location.origin}/project/${token}`)
    setCopied(token); setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        eyebrow="// Job Sites"
        title="Projects"
        subtitle="Notes, change orders, and job documentation."
        actions={
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={16} /> New Project
          </button>
        }
      />

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="card p-5 sm:p-6 space-y-4 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="stamp-label text-brand-600 dark:text-brand-400">// New Site</p>
                  <h2 className="font-display font-bold text-lg text-foreground mt-0.5">Project Details</h2>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  aria-label="Close"
                  className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Project Name <span className="text-brand-600">*</span></label>
                  <input className="input" placeholder="Johnson Kitchen Remodel" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                </div>
                <div>
                  <label className="label">Client</label>
                  <input className="input" placeholder="Client name" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="label">Address</label>
                  <input className="input" placeholder="Job site address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Start Date</label>
                  <input className="input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Est. End Date</label>
                  <input className="input" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="label">Description</label>
                  <textarea className="input h-20 resize-none" placeholder="Brief scope of work" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button onClick={addProject} className="btn-primary"><Plus size={15} /> Create Project</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {fetching && (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {!fetching && projects.length === 0 && (
          <EmptyState
            icon={FolderOpen}
            title="No projects yet"
            description="Create a job site to start logging notes, photos, and change orders."
            action={
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus size={15} /> Create your first project
              </button>
            }
          />
        )}

        {projects.map((proj, i) => {
          const tone = STATUS_TONES[proj.status] || STATUS_TONES.Planning
          const isOpen = openId === proj.id
          const photos = proj.photos || []
          const notes  = proj.notes  || []
          const cos    = proj.change_orders || []
          const pendingCO = cos.filter(c => c.status === 'Pending').length

          return (
            <motion.div
              key={proj.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: Math.min(i * 0.02, 0.15), ease: [0.22, 1, 0.36, 1] }}
              className="card overflow-hidden relative"
            >
              <span className={cn('absolute left-0 top-3 bottom-3 w-1 rounded-r-full', tone.bar)} />

              <button
                onClick={() => setOpenId(o => o === proj.id ? null : proj.id)}
                className="w-full flex items-center justify-between gap-3 px-4 pl-5 py-3.5 hover:bg-accent/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FolderOpen size={16} className="text-brand-500 shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="font-display font-semibold text-sm text-foreground truncate">{proj.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {proj.client}{proj.address ? ` · ${proj.address}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {pendingCO > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-tight bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400">
                      <AlertTriangle size={11} /> {pendingCO}
                    </span>
                  )}
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-tight', tone.badge)}>
                    {proj.status?.replace('_', ' ')}
                  </span>
                  {isOpen ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border p-4 sm:p-5 space-y-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={proj.status}
                          onChange={e => updateStatus(proj.id, e.target.value)}
                          className="input py-1 text-xs w-40"
                        >
                          {Object.keys(STATUS_TONES).map(s => <option key={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                        <button onClick={() => copyLink(proj.public_token)} className="btn-ghost text-xs py-1 px-2">
                          <LinkIcon size={13} /> {copied === proj.public_token ? 'Copied!' : 'Share Link'}
                        </button>
                        {proj.address && (
                          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                            <MapPin size={11} />{proj.address}
                          </span>
                        )}
                        {proj.start_date && (
                          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                            <CalendarIcon size={11} />{proj.start_date}{proj.end_date ? ` → ${proj.end_date}` : ''}
                          </span>
                        )}
                      </div>

                      {proj.description && (
                        <p className="text-sm text-foreground leading-relaxed border-l-2 border-border pl-3 italic">
                          {proj.description}
                        </p>
                      )}

                      {/* Field Notes */}
                      <div>
                        <SectionHeader icon={FileText} title="Field Notes" count={notes.length} />
                        <div className="flex gap-2 mb-2">
                          <input
                            className="input text-sm"
                            placeholder="Add a field note…"
                            value={noteInputs[proj.id] || ''}
                            onChange={e => setNoteInputs(ni => ({ ...ni, [proj.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && addNote(proj.id)}
                          />
                          <button onClick={() => addNote(proj.id)} className="btn-primary shrink-0 py-1.5 px-3 text-sm">Add</button>
                        </div>
                        {notes.length === 0 && (
                          <p className="text-xs text-muted-foreground italic">No notes yet</p>
                        )}
                        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                          {notes.map(note => (
                            <div key={note.id} className="bg-muted/60 rounded-lg px-3 py-2 border border-border">
                              <p className="text-sm text-foreground whitespace-pre-wrap">{note.text}</p>
                              <p className="stamp-label text-muted-foreground mt-1">{note.date}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Photos */}
                      <div>
                        <SectionHeader icon={Camera} title="Job Photos" count={photos.length} />
                        <label className="btn-secondary text-xs cursor-pointer inline-flex mb-2">
                          <Camera size={13} /> Add Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => { uploadPhoto(proj.id, e.target.files?.[0]); e.target.value = '' }}
                          />
                        </label>
                        {photos.length === 0 && (
                          <p className="text-xs text-muted-foreground italic">No photos yet</p>
                        )}
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {photos.map(photo => (
                            <div key={photo.url} className="relative group aspect-square rounded-lg overflow-hidden bg-muted ring-1 ring-border hover:ring-brand-500 transition-all">
                              <a href={photo.url} target="_blank" rel="noreferrer">
                                <img src={photo.url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              </a>
                              <button
                                onClick={() => removePhoto(proj.id, photo)}
                                aria-label="Delete photo"
                                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Change Orders */}
                      <div>
                        <SectionHeader
                          icon={AlertTriangle}
                          title="Change Orders"
                          count={pendingCO}
                          countLabel={pendingCO ? 'pending' : null}
                          tone={pendingCO > 0 ? 'warning' : 'muted'}
                        />
                        <div className="flex gap-2 mb-2">
                          <input
                            className="input text-sm"
                            placeholder="Describe the change order…"
                            value={changeOrderInputs[proj.id] || ''}
                            onChange={e => setChangeOrderInputs(co => ({ ...co, [proj.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && addChangeOrder(proj.id)}
                          />
                          <button onClick={() => addChangeOrder(proj.id)} className="btn-primary shrink-0 py-1.5 px-3 text-sm">Add</button>
                        </div>
                        {cos.length === 0 && (
                          <p className="text-xs text-muted-foreground italic">No change orders</p>
                        )}
                        <div className="space-y-1.5">
                          {cos.map(co => (
                            <div
                              key={co.id}
                              className={cn(
                                'flex items-start justify-between gap-3 rounded-lg px-3 py-2 border',
                                co.status === 'Approved'
                                  ? 'bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20'
                                  : 'bg-yellow-50 dark:bg-yellow-500/5 border-yellow-200 dark:border-yellow-500/20'
                              )}
                            >
                              <div className="min-w-0">
                                <p className="text-sm text-foreground whitespace-pre-wrap">{co.text}</p>
                                <p className="stamp-label text-muted-foreground mt-1">{co.date}</p>
                              </div>
                              <button
                                onClick={() => toggleCOStatus(proj.id, co.id)}
                                className={cn(
                                  'shrink-0 cursor-pointer inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-tight transition-colors',
                                  co.status === 'Approved'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 hover:bg-green-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400 hover:bg-yellow-200'
                                )}
                              >
                                {co.status}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end pt-1 border-t border-border pt-3">
                        <button onClick={() => deleteProject(proj.id)} className="btn-ghost text-red-500 text-sm">
                          <Trash2 size={14} /> Delete Project
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, count, countLabel = null, tone = 'muted' }) {
  const countClass = tone === 'warning'
    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400'
    : 'bg-muted text-muted-foreground'
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon size={13} className="text-muted-foreground" />
      <span className="stamp-label text-muted-foreground">{title}</span>
      {(count > 0 || countLabel) && (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-tight', countClass)}>
          {count}{countLabel ? ` ${countLabel}` : ''}
        </span>
      )}
    </div>
  )
}
