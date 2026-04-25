import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus, Trash2, Download, Upload, Car, Receipt as ReceiptIcon, Loader2,
  Info, FileText, X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { TaxReportPDF, downloadPdf } from '../lib/pdf'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { cn } from '../lib/utils'

const CATEGORIES = ['Materials', 'Tools', 'Fuel', 'Subcontractor', 'Permits', 'Insurance', 'Vehicle', 'Office', 'Other']
const IRS_MILEAGE_RATE = 0.67
const fmt = (n) => `$${(n || 0).toFixed(2)}`

function MoneyTile({ label, value, sub, tone = 'steel' }) {
  const valueTone = {
    steel:   'text-foreground',
    success: 'text-green-600 dark:text-green-500',
    orange:  'text-foreground',
  }
  const ribbon = {
    steel:   'from-steel-700 to-steel-900',
    success: 'from-green-500 to-green-700',
    orange:  'from-brand-500 to-brand-700',
  }
  return (
    <div className="card p-4 relative overflow-hidden">
      <div aria-hidden className={cn('absolute -top-px -left-px h-1 w-12 bg-gradient-to-r rounded-tl-2xl', ribbon[tone])} />
      <div className="stamp-label text-muted-foreground">{label}</div>
      <div className={cn('font-display font-bold text-2xl tabular-nums mt-1', valueTone[tone])}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  )
}

export default function Expenses() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState('expenses')
  const [expenses, setExpenses] = useState([])
  const [mileage, setMileage]   = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const yearMileage  = useMemo(() => mileage.filter(m => new Date(m.date).getFullYear() === year), [mileage, year])

  const expenseTotal     = yearExpenses.reduce((s, e) => s + (e.amount || 0), 0)
  const milesTotal       = yearMileage.reduce((s, m) => s + (m.miles || 0), 0)
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

  const downloadTaxPdf = () => downloadPdf(
    <TaxReportPDF year={year} profile={profile} expenses={yearExpenses} mileage={yearMileage} mileageRate={IRS_MILEAGE_RATE} />,
    `${profile?.business_name || 'ContractorPro'}-${year}-Tax-Report.pdf`
  )

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 size={28} className="animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        eyebrow="// Tax Ledger"
        title="Expenses & Mileage"
        subtitle="Track write-offs and export for taxes."
        actions={
          <div className="flex items-center gap-2">
            <select
              className="input py-1.5 text-sm w-24"
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              aria-label="Year"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y}>{y}</option>)}
            </select>
            <button onClick={downloadCSV} className="btn-secondary text-sm">
              <Download size={14} /> CSV
            </button>
            <button onClick={downloadTaxPdf} className="btn-secondary text-sm">
              <FileText size={14} /> Tax PDF
            </button>
          </div>
        }
      />

      {tableError && (
        <div className="card p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-500/5">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">Database setup required</p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            Run the <code className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-500/15 rounded">003_clients_expenses.sql</code> migration in your Supabase SQL editor to create the <code className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-500/15 rounded">expenses</code> and <code className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-500/15 rounded">mileage</code> tables plus the <code className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-500/15 rounded">receipts</code> storage bucket.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MoneyTile label={`${year} Expenses`} value={fmt(expenseTotal)} tone="steel" />
        <MoneyTile label="Miles Logged"        value={milesTotal.toFixed(0)} tone="orange" />
        <MoneyTile
          label="Est. Mileage Deduction"
          value={fmt(mileageDeduction)}
          tone="success"
          sub={`@ $${IRS_MILEAGE_RATE}/mi · estimate`}
        />
      </div>

      {/* Mileage explainer */}
      <div className="card p-4 border-l-4 border-blue-500 bg-blue-50/60 dark:bg-blue-500/5">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-foreground space-y-1.5 leading-relaxed">
            <p>
              <strong>How mileage deductions work.</strong> The IRS lets you deduct ${IRS_MILEAGE_RATE} per business mile (2024–2026 standard rate). The number above multiplies your logged miles by that rate — it reduces your <em>taxable income</em>, not your tax bill directly. Actual savings depend on your tax bracket (typically 15–30% of the deduction).
            </p>
            <p>
              <strong>What counts:</strong> driving to job sites, supplier runs, estimates, client meetings.{' '}
              <strong>What doesn't:</strong> commuting from home to your regular shop, personal trips.
            </p>
            <p>
              <strong>For accurate logs:</strong> enter trips as they happen — the IRS requires contemporaneous records.
            </p>
            <p className="text-muted-foreground italic pt-1.5 border-t border-blue-200/60 dark:border-blue-500/20">
              This is an estimate, not tax advice. Consult a CPA before filing.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative flex gap-2 border-b border-border">
        {[['expenses', 'Expenses', ReceiptIcon], ['mileage', 'Mileage', Car]].map(([k, label, Icon]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              'relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-display font-semibold tracking-tight cursor-pointer transition-colors',
              tab === k ? 'text-brand-600 dark:text-brand-400' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon size={14} /> {label}
            {tab === k && (
              <motion.span
                layoutId="expenses-tab"
                className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-500"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
          </button>
        ))}
      </div>

      {tab === 'expenses' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowExpense(s => !s)} className="btn-primary">
              <Plus size={15} /> Add Expense
            </button>
          </div>

          <AnimatePresence>
            {showExpense && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="card p-5 sm:p-6 space-y-4 relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="stamp-label text-brand-600 dark:text-brand-400">// New Write-Off</p>
                      <h2 className="font-display font-bold text-lg text-foreground mt-0.5">Add Expense</h2>
                    </div>
                    <button
                      onClick={() => { setShowExpense(false); setEForm(blankExpense) }}
                      aria-label="Close"
                      className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="label">Date</label>
                      <input type="date" className="input" value={eForm.date} onChange={e => setEForm({ ...eForm, date: e.target.value })} />
                    </div>
                    <div><label className="label">Category</label>
                      <select className="input" value={eForm.category} onChange={e => setEForm({ ...eForm, category: e.target.value })}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div><label className="label">Vendor</label>
                      <input className="input" placeholder="Home Depot" value={eForm.vendor} onChange={e => setEForm({ ...eForm, vendor: e.target.value })} />
                    </div>
                    <div><label className="label">Amount</label>
                      <input type="number" step="0.01" className="input" placeholder="0.00" value={eForm.amount} onChange={e => setEForm({ ...eForm, amount: e.target.value })} />
                    </div>
                    <div><label className="label">Project (optional)</label>
                      <select className="input" value={eForm.project_id} onChange={e => setEForm({ ...eForm, project_id: e.target.value })}>
                        <option value="">—</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Receipt</label>
                      <div className="flex items-center gap-2">
                        <label className="btn-secondary text-xs cursor-pointer">
                          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                          {eForm.receipt_url ? 'Replace' : 'Upload'}
                          <input type="file" accept="image/*" className="hidden" onChange={e => uploadReceipt(e.target.files[0])} />
                        </label>
                        {eForm.receipt_url && (
                          <a href={eForm.receipt_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <input className="input" value={eForm.notes} onChange={e => setEForm({ ...eForm, notes: e.target.value })} />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => { setShowExpense(false); setEForm(blankExpense) }} className="btn-secondary">Cancel</button>
                    <button onClick={addExpense} className="btn-primary"><Plus size={15} /> Save</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {yearExpenses.length === 0 ? (
            <EmptyState
              icon={ReceiptIcon}
              title={`No expenses logged for ${year}`}
              description="Snap receipts and log purchases here. They'll roll up into your tax report automatically."
              action={
                <button onClick={() => setShowExpense(true)} className="btn-primary">
                  <Plus size={15} /> Log your first expense
                </button>
              }
            />
          ) : (
            <div className="card overflow-hidden">
              <ul className="divide-y divide-border">
                {yearExpenses.map((e, i) => (
                  <motion.li
                    key={e.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.18, delay: Math.min(i * 0.015, 0.18) }}
                    className="flex items-center gap-3 p-3 hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-semibold text-sm text-foreground">{e.vendor || e.category}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-stamp uppercase bg-muted text-muted-foreground">
                          {e.category}
                        </span>
                        {e.project_id && (
                          <span className="text-xs text-muted-foreground truncate">· {projectName(e.project_id)}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(e.date).toLocaleDateString()}{e.notes && ` · ${e.notes}`}
                      </div>
                    </div>
                    {e.receipt_url && (
                      <a href={e.receipt_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                        Receipt
                      </a>
                    )}
                    <span className="font-display font-bold text-foreground tabular-nums">{fmt(e.amount)}</span>
                    <button
                      onClick={() => removeExpense(e.id)}
                      aria-label="Delete expense"
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'mileage' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowMileage(s => !s)} className="btn-primary">
              <Plus size={15} /> Log Trip
            </button>
          </div>

          <AnimatePresence>
            {showMileage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="card p-5 sm:p-6 space-y-4 relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="stamp-label text-brand-600 dark:text-brand-400">// New Trip</p>
                      <h2 className="font-display font-bold text-lg text-foreground mt-0.5">Log Mileage</h2>
                    </div>
                    <button
                      onClick={() => { setShowMileage(false); setMForm(blankMileage) }}
                      aria-label="Close"
                      className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="label">Date</label>
                      <input type="date" className="input" value={mForm.date} onChange={e => setMForm({ ...mForm, date: e.target.value })} />
                    </div>
                    <div><label className="label">Miles</label>
                      <input type="number" step="0.1" className="input" placeholder="0" value={mForm.miles} onChange={e => setMForm({ ...mForm, miles: e.target.value })} />
                    </div>
                    <div><label className="label">From</label>
                      <input className="input" placeholder="Shop" value={mForm.from_location} onChange={e => setMForm({ ...mForm, from_location: e.target.value })} />
                    </div>
                    <div><label className="label">To</label>
                      <input className="input" placeholder="Job site" value={mForm.to_location} onChange={e => setMForm({ ...mForm, to_location: e.target.value })} />
                    </div>
                    <div><label className="label">Purpose</label>
                      <input className="input" placeholder="Install, estimate visit…" value={mForm.purpose} onChange={e => setMForm({ ...mForm, purpose: e.target.value })} />
                    </div>
                    <div><label className="label">Project (optional)</label>
                      <select className="input" value={mForm.project_id} onChange={e => setMForm({ ...mForm, project_id: e.target.value })}>
                        <option value="">—</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => { setShowMileage(false); setMForm(blankMileage) }} className="btn-secondary">Cancel</button>
                    <button onClick={addMileage} className="btn-primary"><Plus size={15} /> Save</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {yearMileage.length === 0 ? (
            <EmptyState
              icon={Car}
              title={`No trips logged for ${year}`}
              description="Log every drive to a job site, supply run, or estimate visit. Each mile is a write-off."
              action={
                <button onClick={() => setShowMileage(true)} className="btn-primary">
                  <Plus size={15} /> Log your first trip
                </button>
              }
            />
          ) : (
            <div className="card overflow-hidden">
              <ul className="divide-y divide-border">
                {yearMileage.map((m, i) => (
                  <motion.li
                    key={m.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.18, delay: Math.min(i * 0.015, 0.18) }}
                    className="flex items-center gap-3 p-3 hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-semibold text-sm text-foreground truncate">
                        {m.from_location} <span className="text-muted-foreground font-normal">→</span> {m.to_location}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {new Date(m.date).toLocaleDateString()}
                        {m.purpose && ` · ${m.purpose}`}
                        {m.project_id && ` · ${projectName(m.project_id)}`}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-green-600 dark:text-green-500 tabular-nums">
                      {fmt((m.miles || 0) * IRS_MILEAGE_RATE)}
                    </span>
                    <span className="font-display font-bold text-foreground tabular-nums">
                      {(m.miles || 0).toFixed(1)} mi
                    </span>
                    <button
                      onClick={() => removeMileage(m.id)}
                      aria-label="Delete trip"
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
