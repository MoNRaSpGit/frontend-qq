export type QqClientStatus = "ok" | "soon" | "urgent";

// Semaforo de vencimiento -- pedido explicito (15/09/2026):
//   - blanco ("ok"): falta mas de 1 mes
//   - amarillo ("soon"): esta en el mes de vencer (30 dias o menos)
//   - rojo ("urgent"): quedan 5 dias o menos (incluye ya vencido)
export function getDaysUntilDue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  const diffMs = due.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function getClientStatus(dueDate: string): QqClientStatus {
  const daysLeft = getDaysUntilDue(dueDate);
  if (daysLeft <= 5) return "urgent";
  if (daysLeft <= 30) return "soon";
  return "ok";
}
