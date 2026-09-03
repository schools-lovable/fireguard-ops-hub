import { useEffect, useState } from "react";
import App from "@/App";

function Booting() {
  return <div style={{ minHeight: "100vh", background: "#faf7f2" }} aria-hidden="true" />;
}

export function AppView() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Booting />;
  return <App />;
}
