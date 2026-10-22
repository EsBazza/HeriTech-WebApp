/**
 * GET /.well-known/assetlinks.json — Digital Asset Links. Proves to Android that
 * the HeriTech Play Store app and this website belong together, so the app opens
 * the site full screen with no browser bar (a Trusted Web Activity).
 *
 * ANDROID_PACKAGE_NAME is the app id, e.g. ph.edu.ua.heritech.
 * ANDROID_CERT_SHA256 lists the SHA-256 fingerprints, comma-separated: the app
 * signing key from Play Console (Setup → App signing) and the upload key.
 */
export function GET() {
  const packageName = process.env.ANDROID_PACKAGE_NAME;
  const fingerprints = (process.env.ANDROID_CERT_SHA256 ?? "")
    .split(",")
    .map((f) => f.trim().toUpperCase())
    .filter(Boolean);

  const statements =
    packageName && fingerprints.length
      ? [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: { namespace: "android_app", package_name: packageName, sha256_cert_fingerprints: fingerprints },
          },
        ]
      : [];

  return Response.json(statements, { headers: { "Cache-Control": "public, max-age=3600" } });
}
