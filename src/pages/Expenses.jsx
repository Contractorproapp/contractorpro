import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2, Download, Upload, Car, Receipt as ReceiptIcon, Loader2, X, Info, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { TaxReportPDF, downloadPdf } from '../lib/pdf'

const CATEGORIES = ['Materials', 'Tools', 'Fuel', 'Subcontractor', 'Permits', 'Insurance', 'Vehicle', 'Office', 'Other']
const IRS_MILEAGE_RATE = 0.67

export default function Expenses() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState('expenses')
  const [expenses, setExpenses] = useState([])
  const [mileage, setMileage] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableError, setTableError] = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [showMileage, setShowMileage] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [uploading, setUploading] = useState(false)

  const blankExpense = { date: new Date().toISOString().slice(0, 10), category: 'Materials', vendor: '', amount: '', notes: '', project_id: '', receipt_url: '' }
  const blankMileage = { date: new Date().toISOString().slice(0, 10), from_location: '', to_location: '', miles: '', purpose: '', project_id: '' }
  const [eForm, setEForm] = useState(blankExpense)
  const [mForm, setMForm] = useState(blankMileage)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setTab('expenses')
      setShowExpense(true)
      setSearchParams({}, { replace: true })
    }
  }, [])

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('mileage').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('projects').select('id, name').eq('user_id', user.id),
    ]).then(([e, m, p]) => {
      if (e.error) console.error('expenses query error:', e.error)
      if (m.error) console.error('mileage query error:', m.error)
      if (p.error) console.error('projects query error:', p.error)
      setExpenses(e.data || [])
      setMileage(m.data || [])
      setProjects(p.data || [])
      if (e.error || m.error) setTableError(true)
      setLoading(false)
    }).catch((err) => { console.error('expenses load failed:', err); setTableError(true); setLoading(false) })
  }, [user])

  const uploadReceipt = async (file) => {
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('receipts').upload(path, file)
    if (error) { toast.error(error.message); setUploading(false); return }
    const { data } = supabase.storage.from('receipts').getPublicUrl(path)
    setEForm(f => ({ ...f, receipt_url: data.publicUrl }))
    setUploading(false)
  }

  const addExpense = async () => {
    if (!eForm.amount) return
    const payload = {
      user_id: user.id,
      date: eForm.date,
      category: eForm.category,
      vendor: eForm.vendor.trim(),
      amount: parseFloat(eForm.amount) || 0,
      notes: eForm.notes.trim(),
      receipt_url: eForm.receipt_url || null,
      project_id: eForm.project_id || null,
    }
    const { data } = await supabase.from('expenses').insert(payload).select().single()
    if (data) { setExpenses(prev => [data, ...prev]); setEForm(blankExpense); setShowExpense(false) }
  }

  const addMileage = async () => {
    if (!mForm.miles) return
    const payload = {
      user_id: user.id,
      date: mForm.date,
      from_location: mForm.from_location.trim(),
      to_location: mForm.to_location.trim(),
      miles: parseFloat(mForm.miles) || 0,
      purpose: mForm.purpose.trim(),
      project_id: mForm.project_id || null,
    }
    const { data } = await supabase.from('mileage').insert(payload).select().single()
    if (data) { setMileage(prev => [data, ...prev]); setMForm(blankMileage); setShowMileage(false) }
  }

  const removeExpense = async (id) => {
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const removeMileage = async (id) => {
    await supabase.from('mileage').delete().eq('id', id)
    setMileage(prev => prev.filter(m => m.id !== id))
  }

  const yearExpenses = useMemo(() => expenses.filter(e => new Date(e.date).getFullYear() === year), [expenses, year])
  const yearMileage = useMemo(() => mileage.filter(m => new Date(m.date).getFullYear() === year), [mileage, year])

  const expenseTotal = yearExpenses.reduce((s, e) => s + (e.amount || 0), 0)
  const milesTotal = yearMileage.reduce((s, m) => s + (m.miles || 0), 0)
  const mileageDeduction = milesTotal * IRS_MILEAGE_RATE

  const projectName = (id) => projects.find(p => p.id === id)?.name || ''

  const downloadCSV = () => {
    const rows = [
      ['Type', 'Date', 'Category/Purpose', 'Vendor/Route', 'Amount/Miles', 'Project', 'Notes'],
      ...yearExpenses.map(e => ['Expense', e.date, e.category, e.vendor, e.amount, projectName(e.project_id), e.notes]),
      ...yearMileage.map(m => ['Mileage', m.date, m.purpose, `${m.from_location} → ${m.to_location}`, m.miles, projectName(m.project_id), '']),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contractorpro-${year}-expenses.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gray-400" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-14 lg:pt-0">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Expenses & Mileage</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track write-offs and export for taxes</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input py-1.5 text-sm w-24" value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y}>{y}</option>)}
          </select>
          <button onClick={downloadCSV} className="btn-secondary text-sm"><Download size={14} /> CSV</button>
          <button onClick={() => downloadPdf(<TaxReportPDF year={year} profile={profile} expenses={yearExpenses} mileage={yearMileage} mileageRate={IRS_MILEAGE_RATE} />, `${profile?.business_name || 'ContractorPro'}-${year}-Tax-Report.pdf`)} className="btn-secondary text-sm"><FileText size={14} /> Tax PDF</button>
        </div>
      </div>

      {tableError && (
        <div className="card p-4 border-l-4 border-yellow-500 bg-yellow-50">
          <p className="text-sm font-medium text-yellow-800">Database setup required</p>
          <p className="text-xs text-yellow-700 mt-1">
            Run the <code>003_clients_expenses.sql</code> migration in your Supabase SQL editor to create the <code>expenses</code> and <code>mileage</code> tables plus the <code>receipts</code> storage bucket.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4"><div className="text-xs text-gray-500 uppercase">{year} Expenses</div><div className="text-xl font-bold mt-1">${expenseTotal.toFixed(0)}</div></div>
        <div className="card p-4"><div className="text-xs text-gray-500 uppercase">Miles</div><div className="text-xl font-bold mt-1">{milesTotal.toFixed(0)}</div></div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 uppercase">Est. Mileage Deduction</div>
          <div className="text-xl font-bold mt-1 text-green-600">${mileageDeduction.toFixed(0)}</div>
          <div className="text-xs text-gray-400 mt-0.5">@ ${IRS_MILEAGE_RATE}/mi · estimate</div>
        </div>
      </div>

      <div className="card p-4 bg-blue-50/50 border-blue-100">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-600 space-y-1.5">
            <p><strong className="text-gray-800">How mileage deductions work.</strong> The IRS lets you deduct ${IRS_MILEAGE_RATE} per business mile (2024–2026 standard rate). The number above multiplies your logged miles by that rate — it reduces your <em>taxable income</em>, not your tax bill directly. Actual savings depend on your tax bracket (typically 15–30% of the deduction).</p>
            <p><strong className="text-gray-800">What counts:</strong> driving to job sites, supplier runs, estimates, client meetings. <strong className="text-gray-800">What doesn't:</strong> commuting from home to your regular shop, personal trips.</p>
            <p><strong className="text-gray-800">For accurate logs:</strong> enter trips as they happen — the IRS requires contemporaneous records.</p>
            <p className="text-gray-500 italic pt-1 border-t border-blue-100">This is an estimate, not tax advice. Consult a CPA or tax professional before filing.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        {[['expenses', 'Expenses', ReceiptIcon], ['mileage', 'Mileage', Car]].map(([k, label, Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === k ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'expenses' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowExpense(s => !s)} className="btn-primary"><Plus size={15} /> Add Expense</button>
          </div>

          {showExpense && (
            <div className="card p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="label">Date</label><input type="date" className="input" value={eForm.date} onChange={e => setEForm({ ...eForm, date: e.target.value })} /></div>
                <div><label className="label">Category</label>
                  <select className="input" value={eForm.category} onChange={e => setEForm({ ...eForm, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="label">Vendor</label><input className="input" placeholder="Home Depot" value={eForm.vendor} onChange={e => setEForm({ ...eForm, vendor: e.target.value })} /></div>
                <div><label className="label">Amount</label><input type="number" step="0.01" className="input" placeholder="0.00" value={eForm.amount} onChange={e => setEForm({ ...eForm, amount: e.target.value })} /></div>
                <div><label className="label">Project (optional)</label>
                  <select className="input" value={eForm.project_id} onChange={e => setEForm({ ...eForm, project_id: e.target.value })}>
                    <option value="">—</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Receipt</label>
                  <label className="btn-secondary text-xs cursor-pointer">
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    {eForm.receipt_url ? 'Replace Photo' : 'Upload Photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => uploadReceipt(e.target.files[0])} />
                  </label>
                  {eForm.receipt_url && <a href={eForm.receipt_url} target="_blank" rel="noreferrer" className="text-xs text-brand-600 underline ml-2">View</a>}
                </div>
              </div>
              <div><label className="label">Notes</label><input className="input" value={eForm.notes} onChange={e => setEForm({ ...eForm, notes: e.target.value })} /></div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowExpense(false); setEForm(blankExpense) }} className="btn-secondary">Cancel</button>
                <button onClick={addExpense} className="btn-primary"><Plus size={15} /> Save</button>
              </div>
            </div>
          )}

          {yearExpenses.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><ReceiptIcon size={40} className="mx-auto mb-3 opacity-40" /><p className="text-sm">No expenses logged for {year}.</p></div>
          ) : (
            <div className="card overflow-hidden">
              <div className="divide-y">
                {yearExpenses.map(e => (
                  <div key={e.id} className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{e.vendor || e.category}</span>
                        <span className="badge-info text-xs">{e.category}</span>
                        {e.project_id && <span className="text-xs text-gray-400">· {projectName(e.project_id)}</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{new Date(e.date).toLocaleDateString()}{e.notes && ` · ${e.notes}`}</div>
                    </div>
                    {e.receipt_url && <a href={e.receipt_url} target="_blank" rel="noreferrer" className="text-xs text-brand-600 underline">Receipt</a>}
                    <span className="font-semibold">${(e.amount || 0).toFixed(2)}</span>
                    <button onClick={() => removeExpense(e.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'mileage' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowMileage(s => !s)} className="btn-primary"><Plus size={15} /> Log Trip</button>
          </div>

          {showMileage && (
            <div className="card p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="label">Date</label><input type="date" className="input" value={mForm.date} onChange={e => setMForm({ ...mForm, date: e.target.value })} /></div>
                <div><label className="label">Miles</label><input type="number" step="0.1" className="input" placeholder="0" value={mForm.miles} onChange={e => setMForm({ ...mForm, miles: e.target.value })} /></div>
                <div><label className="label">From</label><input className="input" placeholder="Shop" value={mForm.from_location} onChange={e => setMForm({ ...mForm, from_location: e.target.value })} /></div>
                <div><label className="label">To</label><input className="input" placeholder="Job site" value={mForm.to_location} onChange={e => setMForm({ ...mForm, to_location: e.target.value })} /></div>
                <div><label className="label">Purpose</label><input className="input" placeholder="Install, estimate visit…" value={mForm.purpose} onChange={e => setMForm({ ...mForm, purpose: e.target.value })} /></div>
                <div><label className="label">Project (optional)</label>
                  <select className="input" value={mForm.project_id} onChange={e => setMForm({ ...mForm, project_id: e.target.value })}>
                    <option value="">—</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowMileage(false); setMForm(blankMileage) }} className="btn-secondary">Cancel</button>
                <button onClick={addMileage} className="btn-primary"><Plus size={15} /> Save</button>
              </div>
            </div>
          )}

          {yearMileage.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Car size={40} className="mx-auto mb-3 opacity-40" /><p className="text-sm">No trips logged for {year}.</p></div>
          ) : (
            <div className="card overflow-hidden">
              <div className="divide-y">
                {yearMileage.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{m.from_location} → {m.to_location}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(m.date).toLocaleDateString()}
                        {m.purpose && ` · ${m.purpose}`}
                        {m.project_id && ` · ${projectName(m.project_id)}`}
                      </div>
                    </div>
                    <span className="text-xs text-green-600">${((m.miles || 0) * IRS_MILEAGE_RATE).toFixed(2)}</span>
                    <span className="font-semibold">{(m.miles || 0).toFixed(1)} mi</span>
                    <button onClick={() => removeMileage(m.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
