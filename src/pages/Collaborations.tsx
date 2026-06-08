import { Navigate } from "react-router-dom";
import { VENUES_LIST_PATH } from "@/lib/venueRoutes";

/** Legacy URL — permanent redirect to /venues */
export default function Collaborations() {
  return <Navigate to={VENUES_LIST_PATH} replace />;
}
