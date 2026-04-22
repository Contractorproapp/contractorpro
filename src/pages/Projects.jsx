import { useState, useEffect } from 'react'
import { Plus, FolderOpen, FileText, AlertTriangle, Trash2, ChevronDown, ChevronUp, Link, Loader2, Camera, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const STATUS_COLORS = {
  Planning:'bg-gray-100 text-gray-600', 'In Progress':'bg-blue-100 text-blue-700',
  Punch_List:'bg-yellow-100 text-yellow-700', Complete:'bg-green-100 text-green-700', 'On Hold':'bg-orange-100 text-orange-700',
}
const uid = () => Math.random().toString(36).slice(2)

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [fetching, setFetching] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [openId, setOpenId]     = useState(null)
  const [copied, setCopied]     = useState(null)
  const [form, setForm] = useState({ name:'', client:'', address:'', start_date:'', end_date:'', status:'Planning', description:'' })
  const [noteInputs, setNoteInputs]           = useState({})
  const [changeOrderInputs, setChangeOrderInputs] = useState({})

  useEffect(() => {
    if (!user) return
    supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setProjects(data || []); setFetching(false) })
  }, [user])

  const addProject = async () => {
    if (!form.name.trim()) return
    const { data } = await supabase.from('projects').insert({ user_id:user.id, ...form, notes:[], change_orders:[] }).select().single()
    if (data) { setProjects(prev => [data, ...prev]); setForm({ name:'', client:'', address:'', start_date:'', end_date:'', status:'Planning', description:'' }); setShowForm(false) }
  }

  const deleteProject = async (id) => {
    await supabase.from('projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const updateStatus = async (id, status) => {
    await supabase.from('projects').update({ status }).eq('id', id)
    setProjects(prev => prev.map(p => p.id===id ? { ...p, status } : p))
  }

  const addNote = async (id) => {
    const text = noteInputs[id]?.trim()
    if (!text) return
    const proj  = projects.find(p => p.id===id)
    const notes = [{ id:uid(), text, date:new Date().toLocaleString() }, ...(proj.notes||[])]
    await supabase.from('projects').update({ notes }).eq('id', id)
    setProjects(prev => prev.map(p => p.id===id ? { ...p, notes } : p))
    setNoteInputs(ni => ({ ...ni, [id]:'' }))
  }

  const addChangeOrder = async (id) => {
    const text = changeOrderInputs[id]?.trim()
    if (!text) return
    const proj  = projects.find(p => p.id===id)
    const change_orders = [{ id:uid(), text, date:new Date().toLocaleDateString(), status:'Pending' }, ...(proj.change_orders||[])]
    await supabase.from('projects').update({ change_orders }).eq('id', id)
    setProjects(prev => prev.map(p => p.id===id ? { ...p, change_orders } : p))
    setChangeOrderInputs(co => ({ ...co, [id]:'' }))
  }

  const uploadPhoto = async (projId, file) => {
    if (!file) return
    const ext  = file.name.split('.').pop()
    const path = `${user.id}/${projId}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('project-photos').upload(path, file, { upsert: false })
    if (upErr) return
    const { data: pub } = supabase.storage.from('project-photos').getPublicUrl(path)
    const proj   = projects.find(p => p.id===projId)
    const photos = [...(proj.photos||[]), { url: pub.publicUrl, path, uploaded_at: new Date().toISOString() }]
    await supabase.from('projects').update({ photos }).eq('id', projId)
    setProjects(prev => prev.map(p => p.id===projId ? { ...p, photos } : p))
  }

  const removePhoto = async (projId, photo) => {
    await supabase.storage.from('project-photos').remove([photo.path])
    const proj   = projects.find(p => p.id===projId)
    const photos = (proj.photos||[]).filter(p => p.url !== photo.url)
    await supabase.from('projects').update({ photos }).eq('id', projId)
    setProjects(prev => prev.map(p => p.id===projId ? { ...p, photos } : p))
  }

  const toggleCOStatus = async (pid, coid) => {
    const proj = projects.find(p => p.id===pid)
    const change_orders = proj.change_orders.map(co => co.id===coid ? { ...co, status: co.status==='Pending'?'Approved':'Pending' } : co)
    await supabase.from('projects').update({ change_orders }).eq('id', pid)
    setProjects(prev => prev.map(p => p.id===pid ? { ...p, change_orders } : p))
  }

  const copyLink = (token) => {
    navigator.clipboard.writeText(`${window.location.origin}/project/${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-14 lg:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-gray-500 text-sm mt-0.5">Notes, change orders, and job documentation</p>
        </div>
        <button onClick={() => setShowForm(f => !f)} className="btn-primary"><Plus size={16} /> New Project</button>
      </div>

      {showForm && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold">New Project</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Project Name *</label><input className="input" placeholder="Johnson Kitchen Remodel" value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))} /></div>
            <div><label className="label">Client</label><input className="input" placeholder="Client name" value={form.client} onChange={e => setForm(f => ({ ...f, client:e.target.value }))} /></div>
            <div className="col-span-1 sm:col-span-2"><label className="label">Address</label><input className="input" placeholder="Job site address" value={form.address} onChange={e => setForm(f => ({ ...f, address:e.target.value }))} /></div>
            <div><label className="label">Start Date</label><input className="input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date:e.target.value }))} /></div>
            <div><label className="label">Est. End Date</label><input className="input" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date:e.target.value }))} /></div>
            <div className="col-span-1 sm:col-span-2"><label className="label">Description</label><textarea className="input h-16 resize-none" placeholder="Brief scope of work" value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={addProject} className="btn-primary">Create Project</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {fetching && <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-gray-400" /></div>}
        {!fetching && projects.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FolderOpen size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No projects yet. Create your first one above.</p>
          </div>
        )}
        {projects.map(proj => (
          <div key={proj.id} className="card overflow-hidden">
            <button onClick={() => setOpenId(o => o===proj.id ? null : proj.id)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <FolderOpen size={16} className="text-brand-500" />
                <div className="text-left">
                  <div className="font-semibold text-sm">{proj.name}</div>
                  <div className="text-xs text-gray-500">{proj.client}{proj.address ? ` · ${proj.address}` : ''}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${STATUS_COLORS[proj.status] || STATUS_COLORS.Planning}`}>{proj.status}</span>
                {openId===proj.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </button>

            {openId===proj.id && (
              <div className="border-t border-gray-100 p-4 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <select value={proj.status} onChange={e => updateStatus(proj.id, e.target.value)} className="input py-1 text-xs w-40">
                    {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button onClick={() => copyLink(proj.public_token)} className="btn-ghost text-xs py-1 px-2">
                    <Link size={13} /> {copied===proj.public_token ? 'Copied!' : 'Share Link'}
                  </button>
                </div>
                {proj.description && <p className="text-sm text-gray-600">{proj.description}</p>}

                {/* Field Notes */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={14} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">Field Notes</span>
                    <span className="badge bg-gray-100 text-gray-500">{(proj.notes||[]).length}</span>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <input className="input text-sm" placeholder="Add a field note…"
                      value={noteInputs[proj.id]||''}
                      onChange={e => setNoteInputs(ni => ({ ...ni, [proj.id]:e.target.value }))}
                      onKeyDown={e => e.key==='Enter' && addNote(proj.id)} />
                    <button onClick={() => addNote(proj.id)} className="btn-primary shrink-0 py-1.5 px-3 text-sm">Add</button>
                  </div>
                  {(proj.notes||[]).length === 0 && <p className="text-xs text-gray-400 italic">No notes yet</p>}
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {(proj.notes||[]).map(note => (
                      <div key={note.id} className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-sm text-gray-700">{note.text}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{note.date}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Photos */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Camera size={14} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">Job Photos</span>
                    <span className="badge bg-gray-100 text-gray-500">{(proj.photos||[]).length}</span>
                  </div>
                  <label className="btn-ghost text-xs py-1.5 cursor-pointer inline-flex mb-2">
                    <Camera size={13} /> Add Photo
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { uploadPhoto(proj.id, e.target.files?.[0]); e.target.value='' }} />
                  </label>
                  {(proj.photos||[]).length === 0 && <p className="text-xs text-gray-400 italic">No photos yet</p>}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {(proj.photos||[]).map(photo => (
                      <div key={photo.url} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <a href={photo.url} target="_blank" rel="noreferrer">
                          <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        </a>
                        <button onClick={() => removePhoto(proj.id, photo)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Change Orders */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} className="text-yellow-500" />
                    <span className="text-sm font-semibold text-gray-700">Change Orders</span>
                    <span className="badge bg-yellow-100 text-yellow-700">{(proj.change_orders||[]).filter(c => c.status==='Pending').length} pending</span>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <input className="input text-sm" placeholder="Describe the change order…"
                      value={changeOrderInputs[proj.id]||''}
                      onChange={e => setChangeOrderInputs(co => ({ ...co, [proj.id]:e.target.value }))}
                      onKeyDown={e => e.key==='Enter' && addChangeOrder(proj.id)} />
                    <button onClick={() => addChangeOrder(proj.id)} className="btn-primary shrink-0 py-1.5 px-3 text-sm">Add</button>
                  </div>
                  {(proj.change_orders||[]).length === 0 && <p className="text-xs text-gray-400 italic">No change orders</p>}
                  <div className="space-y-1.5">
                    {(proj.change_orders||[]).map(co => (
                      <div key={co.id} className="flex items-start justify-between gap-3 bg-yellow-50 rounded-lg px-3 py-2">
                        <div><p className="text-sm text-gray-700">{co.text}</p><p className="text-xs text-gray-400">{co.date}</p></div>
                        <button onClick={() => toggleCOStatus(proj.id, co.id)}
                          className={`badge shrink-0 cursor-pointer ${co.status==='Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {co.status}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button onClick={() => deleteProject(proj.id)} className="btn-ghost text-red-500 text-sm"><Trash2 size={14} /> Delete Project</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
