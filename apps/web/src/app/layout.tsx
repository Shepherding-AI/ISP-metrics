import "./globals.css";
import { ENV } from "@/lib/env";

export const metadata = {
  title: ENV.APP_NAME,
  description: "Persistent ISP testing + AI insights"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
