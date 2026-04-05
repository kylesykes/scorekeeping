export const evaluateMath = (expr) => {
  try {
    if (!expr) return null;
    if (!/^[0-9+\-*\/().\s]*$/.test(expr)) return null;
    if (!expr.trim()) return null;
    // eslint-disable-next-line no-new-func
    const result = new Function("return " + expr)();
    if (!Number.isFinite(result)) return null;
    return Math.round(result);
  } catch {
    return null;
  }
};
