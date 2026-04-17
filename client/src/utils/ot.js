// Client-side OT — mirrors server logic
// Apply operations to local editor content

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

// Convert Monaco change event to our operation format
// Monaco gives us a list of changes — we convert to our op format
export const monacoChangeToOp = (change, content) => {
  const { rangeOffset, rangeLength, text } = change;

  if (text.length > 0 && rangeLength === 0) {
    // Pure insert
    return {
      type: "insert",
      position: rangeOffset,
      text,
    };
  }

  if (text.length === 0 && rangeLength > 0) {
    // Pure delete
    return {
      type: "delete",
      position: rangeOffset,
      length: rangeLength,
    };
  }

  if (text.length > 0 && rangeLength > 0) {
    // Replace = delete then insert
    // We send as two separate ops
    return [
      {
        type: "delete",
        position: rangeOffset,
        length: rangeLength,
      },
      {
        type: "insert",
        position: rangeOffset,
        text,
      },
    ];
  }

  return null;
};
