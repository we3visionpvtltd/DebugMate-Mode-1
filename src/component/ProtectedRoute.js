// component/ProtectedRoute.js
import React, { useContext } from 'react';
import { MyContext } from '../App';

/**
 * Usage:
 * <ProtectedRoute requiredPage="Create Mails" requiredAction="View">
 *   <CreateMail />
 * </ProtectedRoute>
 *
 * If requiredAction is omitted, checks for 'View' or 'All'.
 * Admin role bypasses checks (full access).
 */

const NotAuthorized = () => (
  <div style={{padding: 40, textAlign: 'center',paddingTop:"120px"}}>
    <h2>Not authorized</h2>
    <p>You don't have permission to view this page. Contact your administrator.</p>
  </div>
);

const ProtectedRoute = ({ children, requiredPage, requiredAction = 'View' }) => {
  const { userRole, userPermissions } = useContext(MyContext);

  // Admin bypass
  if (userRole === 'Admin') return children;

  // No permissions loaded -> deny
  if (!userPermissions || Object.keys(userPermissions).length === 0) {
    return <NotAuthorized />;
  }

  // Permission structure expected:
  // { "Create Mails": { "All": true, "View": true, "Insert": false, ... }, ... }
  const pagePerms = userPermissions[requiredPage];
  if (!pagePerms) return <NotAuthorized />;

  // If 'All' true -> allow
  if (pagePerms['All']) return children;

  // Check requiredAction
  if (pagePerms[requiredAction]) return children;

  // else deny
  return <NotAuthorized />;
};

export default ProtectedRoute;