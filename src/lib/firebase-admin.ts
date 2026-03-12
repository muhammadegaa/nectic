/**
 * Re-exports Firebase Admin SDK from the infrastructure layer.
 * Keeps existing route imports working without change.
 */
export { getAdminAuth as adminAuth } from "@/infrastructure/firebase/firebase-server"
