import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#111827' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 16 },
  logo: { width: 56, height: 56, objectFit: 'contain' },
  bizBlock: { flexDirection: 'column' },
  bizName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  bizMeta: { fontSize: 9, color: '#6B7280' },
  docTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'right', color: '#2563EB' },
  docNum: { fontSize: 9, color: '#6B7280', textAlign: 'right', marginTop: 2 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  col: { flex: 1 },
  table: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  th: { flexDirection: 'row', backgroundColor: '#F9FAFB', paddingVertical: 6, paddingHorizontal: 4, fontWeight: 'bold', fontSize: 9, color: '#374151' },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingVertical: 6, paddingHorizontal: 4 },
  cDesc: { flex: 4 },
  cQty: { flex: 1, textAlign: 'right' },
  cUnit: { flex: 1.2, textAlign: 'right' },
  cTotal: { flex: 1.2, textAlign: 'right' },
  totals: { marginTop: 12, alignSelf: 'flex-end', width: 200 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, fontSize: 10 },
  totalRowFinal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#111827', marginTop: 4, fontSize: 12, fontWeight: 'bold' },
  notes: { marginTop: 20, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 4, fontSize: 9, color: '#374151', lineHeight: 1.4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#9CA3AF', textAlign: 'center' },
  pre: { fontSize: 9, lineHeight: 1.5, color: '#374151', whiteSpace: 'pre-wrap' },
})

function money(n) {
  return '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function Header({ profile, title, number }) {
  return (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        {profile?.logo_url && <Image src={profile.logo_url} style={styles.logo} />}
        <View style={styles.bizBlock}>
          <Text style={styles.bizName}>{profile?.business_name || 'Your Business'}</Text>
          {profile?.phone && <Text style={styles.bizMeta}>{profile.phone}</Text>}
        </View>
      </View>
      <View>
        <Text style={styles.docTitle}>{title}</Text>
        {number && <Text style={styles.docNum}>{number}</Text>}
      </View>
    </View>
  )
}

function ClientBlock({ name, phone, email, address, issueDate, dueDate }) {
  return (
    <View style={styles.row}>
      <View style={styles.col}>
        <Text style={styles.sectionTitle}>Bill To</Text>
        <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>{name || '—'}</Text>
        {phone && <Text style={styles.bizMeta}>{phone}</Text>}
        {email && <Text style={styles.bizMeta}>{email}</Text>}
        {address && <Text style={styles.bizMeta}>{address}</Text>}
      </View>
      <View style={{ ...styles.col, alignItems: 'flex-end' }}>
        {issueDate && (
          <>
            <Text style={styles.sectionTitle}>Issue Date</Text>
            <Text>{issueDate}</Text>
          </>
        )}
        {dueDate && (
          <>
            <Text style={{ ...styles.sectionTitle, marginTop: 6 }}>Due Date</Text>
            <Text>{dueDate}</Text>
          </>
        )}
      </View>
    </View>
  )
}

function LineItemsTable({ items }) {
  const rows = (items || []).filter(i => i.desc)
  return (
    <View style={styles.table}>
      <View style={styles.th}>
        <Text style={styles.cDesc}>Description</Text>
        <Text style={styles.cQty}>Qty</Text>
        <Text style={styles.cUnit}>Unit</Text>
        <Text style={styles.cTotal}>Total</Text>
      </View>
      {rows.length === 0 ? (
        <View style={styles.tr}><Text style={styles.cDesc}>No line items</Text></View>
      ) : rows.map((i, idx) => {
        const qty  = parseFloat(i.qty) || 0
        const unit = parseFloat(i.unit) || 0
        return (
          <View key={idx} style={styles.tr}>
            <Text style={styles.cDesc}>{i.desc}</Text>
            <Text style={styles.cQty}>{qty}</Text>
            <Text style={styles.cUnit}>{money(unit)}</Text>
            <Text style={styles.cTotal}>{money(qty * unit)}</Text>
          </View>
        )
      })}
    </View>
  )
}

export function EstimatePDF({ estimate, profile }) {
  const items = estimate.line_items || []
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.qty)||0)*(parseFloat(i.unit)||0), 0)
  const total = estimate.total ?? subtotal * (1 + (estimate.markup || 0) / 100)
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Header profile={profile} title="ESTIMATE" number={estimate.id ? `#${String(estimate.id).slice(0,8)}` : null} />
        <ClientBlock
          name={estimate.client_name}
          phone={estimate.phone}
          email={estimate.email}
          address={estimate.address}
          issueDate={estimate.created_at ? new Date(estimate.created_at).toLocaleDateString() : null}
        />
        {estimate.job_title && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job</Text>
            <Text>{estimate.job_title}</Text>
          </View>
        )}
        <LineItemsTable items={items} />
        <View style={styles.totals}>
          <View style={styles.totalRow}><Text>Subtotal</Text><Text>{money(subtotal)}</Text></View>
          {estimate.markup ? (
            <View style={styles.totalRow}><Text>Markup ({estimate.markup}%)</Text><Text>{money(subtotal * (estimate.markup/100))}</Text></View>
          ) : null}
          <View style={styles.totalRowFinal}><Text>Total</Text><Text>{money(total)}</Text></View>
        </View>
        {estimate.output && (
          <View style={styles.notes}>
            <Text style={styles.pre}>{estimate.output}</Text>
          </View>
        )}
        <Text style={styles.footer} fixed>
          Thank you for your business — {profile?.business_name || ''}
        </Text>
      </Page>
    </Document>
  )
}

export function InvoicePDF({ invoice, profile }) {
  const items = invoice.line_items || []
  const subtotal = invoice.subtotal ?? items.reduce((s, i) => s + (parseFloat(i.qty)||0)*(parseFloat(i.unit)||0), 0)
  const tax = invoice.tax ?? 0
  const total = invoice.total ?? subtotal + tax
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Header profile={profile} title="INVOICE" number={invoice.invoice_number} />
        <ClientBlock
          name={invoice.client_name}
          phone={invoice.client_phone}
          email={invoice.client_email}
          issueDate={invoice.issue_date}
          dueDate={invoice.due_date}
        />
        {invoice.job_title && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job</Text>
            <Text>{invoice.job_title}</Text>
          </View>
        )}
        <LineItemsTable items={items} />
        <View style={styles.totals}>
          <View style={styles.totalRow}><Text>Subtotal</Text><Text>{money(subtotal)}</Text></View>
          {tax > 0 && (
            <View style={styles.totalRow}><Text>Tax ({invoice.tax_rate || 0}%)</Text><Text>{money(tax)}</Text></View>
          )}
          <View style={styles.totalRowFinal}><Text>Total Due</Text><Text>{money(total)}</Text></View>
        </View>
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.pre}>{invoice.notes}</Text>
          </View>
        )}
        {invoice.payment_link && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Pay Online</Text>
            <Text style={{ color: '#2563EB' }}>{invoice.payment_link}</Text>
          </View>
        )}
        <Text style={styles.footer} fixed>
          {invoice.status === 'Paid' ? 'PAID — Thank you!' : 'Please remit payment by the due date above.'}
        </Text>
      </Page>
    </Document>
  )
}

export async function downloadPdf(doc, filename) {
  const blob = await pdf(doc).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
