/** FireGuard visual system: every data-backed workflow remains inside the shared Quiet Incident Command shell, including the in-app exception centre. */
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { FireGuardShell } from "./components/FireGuardShell";
import { ThemeProvider } from "./contexts/ThemeContext";
import Clients from "./pages/Clients";
import ClientMap from "./pages/ClientMap";
import Academy from "./pages/Academy";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Exceptions from "./pages/Exceptions";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import Reviews from "./pages/Reviews";
import Service from "./pages/Service";
import ServiceDetail from "./pages/ServiceDetail";
import RolePinAccess from "./pages/RolePinAccess";
import Settings from "./pages/Settings";
import Staff from "./pages/Staff";
import Support from "./pages/Support";
import { getFireGuardDocumentTitle } from "./lib/routePurpose";

function RouteDocumentTitle() {
  const [location] = useLocation();
  useEffect(() => { document.title = getFireGuardDocumentTitle(location); }, [location]);
  return null;
}

function Router() { return <><RouteDocumentTitle /><Switch><Route path="/access" component={RolePinAccess} /><Route><FireGuardShell><Switch><Route path="/" component={Dashboard} /><Route path="/academy" component={Academy} /><Route path="/chat" component={Chat} /><Route path="/clients/map" component={ClientMap} /><Route path="/clients" component={Clients} /><Route path="/service/:id" component={ServiceDetail} /><Route path="/service" component={Service} /><Route path="/reviews" component={Reviews} /><Route path="/exceptions" component={Exceptions} /><Route path="/team" component={Staff} /><Route path="/staff" component={Staff} /><Route path="/profile" component={Profile} /><Route path="/settings/access" component={Settings} /><Route path="/settings" component={Settings} /><Route path="/support" component={Support} /><Route path="/reports" component={Reports} /><Route path="/notifications" component={Notifications} /><Route component={Dashboard} /></Switch></FireGuardShell></Route></Switch></>; }
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster position="bottom-right" richColors /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
