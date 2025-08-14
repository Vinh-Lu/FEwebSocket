
export function hasPermission(api: string,method: string): boolean {
  const permissions = getPermissions();
  return permissions.find((perm: any) => perm.api === api && perm.method === method);
}
export function getPermissions() {
  const data = localStorage.getItem("grantSsoList");
  return data ? JSON.parse(data) : [];
}
export function hasPermissionWithProviderKey(providerKey: string): any {
  const permissions = getPermissions();
  return permissions.find((perm: any) => perm.provider_key == providerKey);
}