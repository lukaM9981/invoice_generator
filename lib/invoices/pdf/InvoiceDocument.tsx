import path from "node:path";

import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { formatMoney, formatQuantity } from "@/lib/invoices/calculations";
import { formatDate } from "@/lib/invoices/status";
import type { InvoiceLine, PartyDetails } from "@/lib/invoices/types";

const FONT_DIR = path.join(process.cwd(), "lib", "invoices", "pdf", "fonts");

Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(FONT_DIR, "Inter-Regular.woff"), fontWeight: 400 },
    { src: path.join(FONT_DIR, "Inter-SemiBold.woff"), fontWeight: 600 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

export type InvoicePdfData = {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  currency: string;
  tax_rate: string;
  subtotal: string;
  tax_amount: string;
  total: string;
  comments: string | null;
  sender: PartyDetails;
  client: PartyDetails;
  lines: InvoiceLine[];
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9.5,
    color: "#18181b",
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  brand: { fontSize: 13, fontWeight: 600, lineHeight: 1.3, maxWidth: 260 },
  titleBlock: { alignItems: "flex-end" },
  eyebrow: {
    fontSize: 8,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    lineHeight: 1.2,
    marginBottom: 6,
  },
  number: { fontSize: 20, fontWeight: 600, lineHeight: 1.2 },
  meta: {
    flexDirection: "row",
    paddingVertical: 16,
    marginBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  metaItem: { flex: 1 },
  metaLabel: {
    fontSize: 8,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    lineHeight: 1.2,
    marginBottom: 5,
  },
  metaValue: { fontSize: 10.5, fontWeight: 600, lineHeight: 1.3 },
  metaAmount: { fontSize: 12, fontWeight: 600, lineHeight: 1.3 },
  parties: { flexDirection: "row", marginBottom: 32 },
  party: { flex: 1, paddingRight: 16 },
  partyLabel: {
    fontSize: 8,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  partyName: { fontWeight: 600, fontSize: 10.5, lineHeight: 1.35, marginBottom: 2 },
  muted: { color: "#52525b" },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#18181b",
    paddingBottom: 6,
    fontSize: 8,
    color: "#52525b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e4e4e7",
    paddingVertical: 7,
  },
  colDescription: { flex: 1, paddingRight: 8 },
  colQuantity: { width: 70, textAlign: "right" },
  colPrice: { width: 80, textAlign: "right" },
  colTotal: { width: 90, textAlign: "right" },
  totals: { marginTop: 14, marginLeft: "auto", width: 240 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#18181b",
    marginTop: 4,
    paddingTop: 6,
    fontSize: 12,
    lineHeight: 1.3,
    fontWeight: 600,
  },
  comments: {
    marginTop: 36,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#e4e4e7",
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#a1a1aa",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function PartyBlock({ label, party }: { label: string; party: PartyDetails }) {
  const primary = party.company_name ?? party.full_name;
  const secondary = party.company_name && party.full_name ? party.full_name : null;

  return (
    <View style={styles.party}>
      <Text style={styles.partyLabel}>{label}</Text>
      {primary ? <Text style={styles.partyName}>{primary}</Text> : null}
      {secondary ? <Text>{secondary}</Text> : null}
      {party.address ? <Text style={styles.muted}>{party.address}</Text> : null}
      {party.email ? <Text style={styles.muted}>{party.email}</Text> : null}
      {party.website ? <Text style={styles.muted}>{party.website}</Text> : null}
      {party.vat_id ? <Text style={styles.muted}>VAT ID: {party.vat_id}</Text> : null}
    </View>
  );
}

export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const money = (amount: string) => formatMoney(amount, data.currency);

  return (
    <Document title={`Invoice ${data.invoice_number}`} author={data.sender.company_name ?? data.sender.full_name ?? undefined}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>
            {data.sender.company_name ?? data.sender.full_name ?? ""}
          </Text>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>Invoice</Text>
            <Text style={styles.number}>{data.invoice_number}</Text>
          </View>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Invoice date</Text>
            <Text style={styles.metaValue}>{formatDate(data.invoice_date)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Due date</Text>
            <Text style={styles.metaValue}>{formatDate(data.due_date)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Currency</Text>
            <Text style={styles.metaValue}>{data.currency}</Text>
          </View>
          <View style={[styles.metaItem, { alignItems: "flex-end" }]}>
            <Text style={styles.metaLabel}>Amount due</Text>
            <Text style={styles.metaAmount}>{money(data.total)}</Text>
          </View>
        </View>

        <View style={styles.parties}>
          <PartyBlock label="From" party={data.sender} />
          <PartyBlock label="To" party={data.client} />
        </View>

        <View style={styles.tableHeader} fixed>
          <Text style={styles.colDescription}>Description</Text>
          <Text style={styles.colQuantity}>Quantity</Text>
          <Text style={styles.colPrice}>Unit price</Text>
          <Text style={styles.colTotal}>Amount</Text>
        </View>
        {data.lines.map((line) => (
          <View key={line.id} style={styles.row} wrap={false}>
            <Text style={styles.colDescription}>{line.description}</Text>
            <Text style={styles.colQuantity}>
              {formatQuantity(line.quantity)}
              {line.unit_type === "hours" ? " h" : ""}
            </Text>
            <Text style={styles.colPrice}>{money(line.unit_price)}</Text>
            <Text style={styles.colTotal}>{money(line.line_total)}</Text>
          </View>
        ))}

        <View style={styles.totals} wrap={false}>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{money(data.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Tax ({formatQuantity(data.tax_rate)}%)</Text>
            <Text>{money(data.tax_amount)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Total</Text>
            <Text>{money(data.total)}</Text>
          </View>
        </View>

        {data.comments ? (
          <View style={styles.comments} wrap={false}>
            <Text style={styles.partyLabel}>Comments</Text>
            <Text>{data.comments}</Text>
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>{data.invoice_number}</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
