export const metadata = {
  title: "Mr. Nitin Bhujbal | Organic Farming Consultant",
  description: "Best Organic Farming Advisor & Consultant in Maharashtra. Expert in organic farming, soil testing, and sustainable farm planning.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="mr">
      <body style={{ margin: 0, padding: 0, backgroundColor: "#f4fbf4" }}>
        {children}
      </body>
    </html>
  );
}
