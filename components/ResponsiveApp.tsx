"use client";

import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import Dashboard from "./Dashboard";
import MobileApp from "./MobileApp";

// Mesma URL para os dois formatos: telas estreitas (celular) recebem a versão mobile,
// sem kanban; o restante usa o dashboard atual.
export default function ResponsiveApp({ user }: { user: User }) {
  const [mobile, setMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (mobile === null) return null;
  return mobile ? <MobileApp user={user} /> : <Dashboard user={user} />;
}
