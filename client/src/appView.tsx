import { ClientOnly } from "@tanstack/react-router";
import App from "@/App";

function Booting() {
  return (
    <div style={{ minHeight: "100vh", background: "#faf7f2" }} aria-hidden="true" />
  );
}

export function AppView() {
  return (
    <ClientOnly fallback={<Booting />}>
      <App />
    </ClientOnly>
  );
}
