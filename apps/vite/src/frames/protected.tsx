import { Document } from "@/components/document";

export default function Protected() {
  return (
    <Document>
      <h1>Protected Page</h1>
      <p>This is a protected page that can only be accessed by authenticated users.</p>
    </Document>
  );
}
