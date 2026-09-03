/**
 * Temporary FireGuard access policy.
 *
 * Set this to false when Manus OAuth should be enforced again. Direct access
 * intentionally resolves every unsigned request as the provisioned FireGuard
 * administrator account; it is suitable only while the workspace is meant to
 * be open without individual attribution.
 */
export const FIREGUARD_DIRECT_ACCESS = true;
