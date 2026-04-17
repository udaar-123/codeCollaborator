export const transform = (opA, opB) => {
  // Both inserts
  if (opA.type === "insert" && opB.type === "insert") {
    if (opA.position < opB.position) {
      // opA inserted before opB → shift opB right
      return { ...opB, position: opB.position + opA.text.length };
    }
    if (opA.position === opB.position) {
      // Same position — opA goes first by convention (server wins)
      return { ...opB, position: opB.position + opA.text.length };
    }
    // opA after opB — no shift needed
    return opB;
  }

  // opA is delete, opB is insert
  if (opA.type === "delete" && opB.type === "insert") {
    if (opA.position < opB.position) {
      // opA deleted before opB → shift opB left
      return { ...opB, position: Math.max(0, opB.position - opA.length) };
    }
    return opB;
  }

  // opA is insert, opB is delete
  if (opA.type === "insert" && opB.type === "delete") {
    if (opA.position <= opB.position) {
      // opA inserted before opB → shift opB right
      return { ...opB, position: opB.position + opA.text.length };
    }
    return opB;
  }

  // Both deletes
  if (opA.type === "delete" && opB.type === "delete") {
    if (opA.position < opB.position) {
      return { ...opB, position: Math.max(0, opB.position - opA.length) };
    }
    if (opA.position === opB.position) {
      // Same character deleted twice → make opB a no-op
      return { ...opB, type: "noop" };
    }
    return opB;
  }

  return opB;
};

// Apply an operation to a string — returns new string
export const applyOp = (content, op) => {
  if (op.type === "noop") return content;

  if (op.type === "insert") {
    return content.slice(0, op.position) + op.text + content.slice(op.position);
  }

  if (op.type === "delete") {
    return (
      content.slice(0, op.position) + content.slice(op.position + op.length)
    );
  }

  return content;
};
