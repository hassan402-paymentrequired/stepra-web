import { Navigate } from "react-router";

/** Legacy route — redirects to the unified exam flow with UUID-based category resolution. */
const DLIPracticeSelection = () => (
  <Navigate to="/exam/dli/practice-questions" replace />
);

export default DLIPracticeSelection;
