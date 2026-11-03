// Keep the existing admins collection so existing passwords and accounts survive.
// Legacy accounts have no trusted administrator designation: promote the owner
// explicitly with npm run admin:promote -- owner@example.com.
export function accountRole(account) { return account.role || 'user'; }
export function accountStatus(account) { return account.status || 'active'; }
export function publicAccount(account) {
  return {
    id: String(account._id),
    username: account.username,
    email: account.email,
    role: accountRole(account),
    status: accountStatus(account),
    institution: account.institution || '',
    createdAt: account.createdAt,
  };
}
