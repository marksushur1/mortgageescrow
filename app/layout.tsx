export const metadata = { title: "Two Tables on Vercel" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#0b1020", color: "#e7e9ee" }}>
        <div style={{ maxWidth: 1100, margin: "32px auto", padding: "0 16px" }}>{children}</div>
      </body>
    </html>
  );
}
