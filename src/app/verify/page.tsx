import { redirect } from "next/navigation";

/** The serial lookup now lives in the home page hero; pass QR codes still open /verify/[serial]. */
export default function VerifyLookupPage() {
  redirect("/#verify");
}
