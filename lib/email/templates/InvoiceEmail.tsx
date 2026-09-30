import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type InvoiceEmailProps = {
  senderName: string;
  message: string;
  invoiceNumber: string;
  total: string;
  dueDate: string;
  paymentUrl: string | null;
};

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  padding: "24px 0",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px",
};

const paragraph = {
  color: "#18181b",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 12px",
};

const label = { color: "#71717a", fontSize: "13px", margin: "0" };
const value = { color: "#18181b", fontSize: "15px", fontWeight: 600, margin: "0 0 10px" };

export function InvoiceEmail({
  senderName,
  message,
  invoiceNumber,
  total,
  dueDate,
  paymentUrl,
}: InvoiceEmailProps) {
  const paragraphs = message.split(/\n{2,}/);

  return (
    <Html lang="en">
      <Head />
      <Preview>{`Invoice ${invoiceNumber} from ${senderName}: ${total}, due ${dueDate}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          {paragraphs.map((text, index) => (
            <Text key={index} style={{ ...paragraph, whiteSpace: "pre-line" }}>
              {text}
            </Text>
          ))}

          <Hr style={{ borderColor: "#e4e4e7", margin: "24px 0" }} />

          <Section>
            <Text style={label}>Invoice</Text>
            <Text style={value}>{invoiceNumber}</Text>
            <Text style={label}>Amount due</Text>
            <Text style={value}>{total}</Text>
            <Text style={label}>Due date</Text>
            <Text style={value}>{dueDate}</Text>
          </Section>

          {paymentUrl ? (
            <Section style={{ marginTop: "16px" }}>
              <Button
                href={paymentUrl}
                style={{
                  backgroundColor: "#18181b",
                  borderRadius: "8px",
                  color: "#ffffff",
                  display: "inline-block",
                  fontSize: "15px",
                  fontWeight: 600,
                  padding: "12px 20px",
                  textDecoration: "none",
                }}
              >
                Pay {total} online
              </Button>
            </Section>
          ) : null}

          <Text style={{ ...label, marginTop: "24px" }}>
            The invoice is attached as a PDF. Reply to this email to reach {senderName}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
