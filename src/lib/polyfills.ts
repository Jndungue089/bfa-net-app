import * as Crypto from "expo-crypto";

// Hermes has no WebCrypto. Shared code (idempotency keys) only needs a CSPRNG.
const g = globalThis as { crypto?: Partial<Crypto> };
if (!g.crypto?.getRandomValues) g.crypto = { ...g.crypto, getRandomValues: Crypto.getRandomValues as Crypto["getRandomValues"] };
