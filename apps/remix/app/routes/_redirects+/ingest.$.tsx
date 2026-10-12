/** Product analytics are disabled in the 0xDocHub fork. */
export function loader() {
  return new Response(null, { status: 404 });
}

export function action() {
  return new Response(null, { status: 404 });
}
