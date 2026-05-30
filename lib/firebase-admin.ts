import crypto from "crypto";

export interface DecodedFirebaseToken {
  uid: string;
  email?: string;
  phone_number?: string;
  name?: string;
  picture?: string;
}

/**
 * Verifies a Firebase ID token on the server using Google's public certificates.
 * This does NOT require any private key or service account credential in the .env file.
 */
export async function verifyFirebaseToken(token: string): Promise<DecodedFirebaseToken | null> {
  // Local dev mock token fallback
  if (process.env.NODE_ENV === "development" && token.startsWith("mock-")) {
    const isAdmin = token === "mock-admin";
    return {
      uid: isAdmin ? "mock-admin-uid" : "mock-customer-uid",
      email: isAdmin ? "admin@bakewell.com" : "customer@bakewell.com",
      name: isAdmin ? "Mock Admin" : "Mock Customer",
    };
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("Invalid Firebase token format (parts length is not 3)");
      return null;
    }

    const header = JSON.parse(Buffer.from(parts[0], "base64").toString());
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      console.error("NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable is missing");
      return null;
    }

    // 1. Verify standard JWT claims
    if (payload.aud !== projectId) {
      console.error(`Firebase token audience mismatch. Expected: ${projectId}, Got: ${payload.aud}`);
      return null;
    }

    if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
      console.error(`Firebase token issuer mismatch. Expected: https://securetoken.google.com/${projectId}, Got: ${payload.iss}`);
      return null;
    }

    if (payload.exp * 1000 < Date.now()) {
      console.error("Firebase token expired");
      return null;
    }

    // 2. Fetch Google's public certificates
    const res = await fetch(
      "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
      { next: { revalidate: 3600 } } // Cache certificates for 1 hour
    );
    if (!res.ok) {
      console.error("Failed to fetch Google public certificates for verification");
      return null;
    }

    const certs = await res.json();
    const cert = certs[header.kid];
    if (!cert) {
      console.error(`Google public certificate key ID (kid) "${header.kid}" not found in certificates`);
      return null;
    }

    // 3. Verify cryptographic RS256 signature
    const verify = crypto.createVerify("SHA256");
    verify.update(`${parts[0]}.${parts[1]}`);
    
    // Normalize base64url signature representation to standard base64
    let signature = parts[2].replace(/-/g, "+").replace(/_/g, "/");
    while (signature.length % 4) {
      signature += "=";
    }
    
    const isValid = verify.verify(cert, signature, "base64");
    if (!isValid) {
      console.error("Firebase token cryptographic signature is invalid");
      return null;
    }

    return {
      uid: payload.sub,
      email: payload.email,
      phone_number: payload.phone_number,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (error) {
    console.error("Error during Firebase token verification:", error);
    return null;
  }
}
