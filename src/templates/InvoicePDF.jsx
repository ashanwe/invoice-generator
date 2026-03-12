import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { subtotal, taxAmount, total, formatCurrency } from '../utils/calculations'

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: 'Helvetica', color: '#1e293b' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 },
  logo: { width: 80, height: 40, objectFit: 'contain' },
  invoiceTitleBlock: { alignItems: 'flex-end' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2563eb' },
  invoiceNum: { fontSize: 10, color: '#64748b', marginTop: 4 },
  invoiceDates: { fontSize: 9, color: '#64748b', marginTop: 2 },

  // From / To
  fromToRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  fromToBlock: { width: '45%' },
  sectionLabel: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  name: { fontWeight: 'bold', fontSize: 11, marginBottom: 2 },
  detail: { color: '#64748b', marginBottom: 3, lineHeight: 1.6 },
  addressLine: { color: '#64748b', fontSize: 10 },
  addressLineWrap: { marginBottom: 4 },

  // Divider
  divider: { borderBottom: '1 solid #e2e8f0', marginBottom: 16 },

  // Table
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#2563eb',
    color: 'white', padding: '8 12', borderRadius: 4, marginBottom: 0,
  },
  tableRow: { flexDirection: 'row', padding: '8 12', borderBottom: '1 solid #f1f5f9' },
  tableRowAlt: { flexDirection: 'row', padding: '8 12', borderBottom: '1 solid #f1f5f9', backgroundColor: '#f8fafc' },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'center' },
  col3: { flex: 1, textAlign: 'right' },
  col4: { flex: 1, textAlign: 'right' },
  tableHeaderText: { color: 'white', fontWeight: 'bold', fontSize: 9 },

  // Totals
  totalsBlock: { alignItems: 'flex-end', marginTop: 16 },
  totalRow: { flexDirection: 'row', marginTop: 4 },
  totalLabel: { width: 120, textAlign: 'right', color: '#64748b' },
  totalValue: { width: 80, textAlign: 'right' },
  grandTotalRow: { flexDirection: 'row', marginTop: 8, paddingTop: 8, borderTop: '2 solid #2563eb' },
  grandTotalLabel: { width: 120, textAlign: 'right', fontWeight: 'bold', fontSize: 12, color: '#2563eb' },
  grandTotalValue: { width: 80, textAlign: 'right', fontWeight: 'bold', fontSize: 12, color: '#2563eb' },

  // Notes / message
  notesBlock: { marginTop: 28, padding: '12 16', backgroundColor: '#eff6ff', borderRadius: 6, borderLeft: '3 solid #2563eb' },
  notesLabel: { fontSize: 8, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  notesText: { color: '#1e40af', lineHeight: 1.6 },

  // Bank details — pinned to bottom
  bankBlock: { position: 'absolute', bottom: 48, left: 48, right: 48, padding: '12 16', backgroundColor: '#f8fafc', borderRadius: 6, border: '1 solid #e2e8f0' },
  bankLabel: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  bankRow: { flexDirection: 'row', marginBottom: 4 },
  bankKey: { width: 110, color: '#64748b', fontSize: 9 },
  bankValue: { color: '#1e293b', fontSize: 9, fontWeight: 'bold' },

  // Footer — sits below bank details
  footer: { position: 'absolute', bottom: 16, left: 48, right: 48, borderTop: '1 solid #e2e8f0', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#94a3b8' },
})

export function InvoicePDF({ invoice }) {
  const hasBankDetails = invoice.bank && (
    invoice.bank.bankName || invoice.bank.accountName || invoice.bank.accountNumber
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Header: Logo + INVOICE title ── */}
        <View style={styles.header}>
          <View>
            {invoice.logo
              ? <Image style={styles.logo} src={invoice.logo} />
              : <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1e293b' }}>{invoice.from.name}</Text>
            }
          </View>
          <View style={styles.invoiceTitleBlock}>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.invoiceNum}>#{invoice.invoiceNumber}</Text>
            {invoice.issueDate && (
              <Text style={styles.invoiceDates}>Issued: {invoice.issueDate}</Text>
            )}
            {invoice.dueDate && (
              <Text style={styles.invoiceDates}>Due: {invoice.dueDate}</Text>
            )}
          </View>
        </View>

        {/* ── From / To ── */}
        <View style={styles.fromToRow}>
          <View style={styles.fromToBlock}>
            <Text style={styles.sectionLabel}>From</Text>
            <Text style={styles.name}>{invoice.from.name}</Text>
            {invoice.from.email ? <Text style={styles.detail}>{invoice.from.email}</Text> : null}
            {invoice.from.address
              ? <View style={{ marginTop: 1 }}>
                  {invoice.from.address.split('\n').map((line, i) =>
                    line.trim()
                      ? <View key={i} style={styles.addressLineWrap}>
                          <Text style={styles.addressLine}>{line}</Text>
                        </View>
                      : null
                  )}
                </View>
              : null}
          </View>
          <View style={styles.fromToBlock}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.name}>{invoice.to.name}</Text>
            {invoice.to.email ? <Text style={styles.detail}>{invoice.to.email}</Text> : null}
            {invoice.to.address
              ? <View style={{ marginTop: 1 }}>
                  {invoice.to.address.split('\n').map((line, i) =>
                    line.trim()
                      ? <View key={i} style={styles.addressLineWrap}>
                          <Text style={styles.addressLine}>{line}</Text>
                        </View>
                      : null
                  )}
                </View>
              : null}
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Items Table ── */}
        <View style={styles.tableHeader}>
          <Text style={[styles.col1, styles.tableHeaderText]}>Description</Text>
          <Text style={[styles.col2, styles.tableHeaderText]}>Qty</Text>
          <Text style={[styles.col3, styles.tableHeaderText]}>Rate</Text>
          <Text style={[styles.col4, styles.tableHeaderText]}>Amount</Text>
        </View>

        {invoice.items.map((item, index) => (
          <View key={item.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={styles.col1}>{item.description}</Text>
            <Text style={styles.col2}>{item.qty}</Text>
            <Text style={styles.col3}>{formatCurrency(item.rate)}</Text>
            <Text style={styles.col4}>{formatCurrency(item.qty * item.rate)}</Text>
          </View>
        ))}

        {/* ── Totals ── */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal(invoice.items))}</Text>
          </View>
          {invoice.taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoice.taxRate}%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(taxAmount(invoice.items, invoice.taxRate))}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Due</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(total(invoice.items, invoice.taxRate))}</Text>
          </View>
        </View>

        {/* ── Notes / Message ── */}
        {invoice.notes ? (
          <View style={styles.notesBlock}>
            <Text style={styles.notesLabel}>Message</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}

        {/* ── Bank Details ── */}
        {hasBankDetails && (
          <View style={styles.bankBlock}>
            <Text style={styles.bankLabel}>Payment / Bank Details</Text>
            {invoice.bank.bankName && (
              <View style={styles.bankRow}>
                <Text style={styles.bankKey}>Bank Name</Text>
                <Text style={styles.bankValue}>{invoice.bank.bankName}</Text>
              </View>
            )}
            {invoice.bank.accountName && (
              <View style={styles.bankRow}>
                <Text style={styles.bankKey}>Account Name</Text>
                <Text style={styles.bankValue}>{invoice.bank.accountName}</Text>
              </View>
            )}
            {invoice.bank.accountNumber && (
              <View style={styles.bankRow}>
                <Text style={styles.bankKey}>Account Number</Text>
                <Text style={styles.bankValue}>{invoice.bank.accountNumber}</Text>
              </View>
            )}
            {invoice.bank.routingNumber && (
              <View style={styles.bankRow}>
                <Text style={styles.bankKey}>Routing / Sort Code</Text>
                <Text style={styles.bankValue}>{invoice.bank.routingNumber}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{invoice.from.name}</Text>
          <Text style={styles.footerText}>{invoice.invoiceNumber}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          } />
        </View>

      </Page>
    </Document>
  )
}