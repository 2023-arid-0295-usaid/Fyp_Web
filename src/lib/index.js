// { "userRole": "Client" } etc — matches the tests/call sites in the RN app.

export const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
