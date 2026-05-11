export function jsonUnauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function jsonForbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

export function jsonNotFound() {
  return Response.json({ error: "Not found" }, { status: 404 });
}

export function jsonBadRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function jsonConflict(message: string) {
  return Response.json({ error: message }, { status: 409 });
}
