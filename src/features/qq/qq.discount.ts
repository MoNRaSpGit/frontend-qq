// Codigo de descuento (26/09/2026, pedido explicito; configurable por el
// admin desde el 28/09/2026): el clasico "descuento por poner el codigo"
// -- ahora el codigo, el porcentaje y si esta habilitado o no viven en el
// backend (ver QqDiscountConfig), no fijos aca. Sin backend de ordenes
// reales en QQ (ver CartDrawer), la comparacion del codigo tipeado sigue
// siendo del lado del cliente, igual que antes.
export function isValidDiscountCode(input: string, configuredCode: string): boolean {
  const normalizedConfigured = configuredCode.trim().toLowerCase();
  if (!normalizedConfigured) return false;
  return input.trim().toLowerCase() === normalizedConfigured;
}

export function applyDiscount(total: number, percentage: number): number {
  return Math.round(total * (1 - percentage / 100));
}
