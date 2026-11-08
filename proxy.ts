// Unknown member or state ids get a real 404. Pages stream a 200 shell before they can check.
import { NextResponse, type NextRequest } from "next/server";
import { getMember, getState } from "@/lib/data";

export function proxy(request: NextRequest) {
  const [, section, id] = request.nextUrl.pathname.split("/");
  const known = section === "member" ? getMember(id) : getState(id.toUpperCase());
  if (known) return NextResponse.next();
  return NextResponse.rewrite(new URL("/404", request.url), { status: 404 });
}

export const config = {
  matcher: ["/member/:id", "/state/:st"],
};
