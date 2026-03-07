import { getQueryMap, subBefore } from "@pureadmin/utils";
import { removeToken, setToken, type SetTokenPayload } from "./auth";

function parseSsoPayload(): SetTokenPayload | null {
  const params = getQueryMap(location.href) as Record<
    string,
    string | undefined
  >;
  const username = String(params.username || "").trim();
  const accessToken = String(params.accessToken || "").trim();
  const rolesRaw = params.roles;

  if (!username || !accessToken || !rolesRaw) {
    return null;
  }

  const roles = String(rolesRaw)
    .split(",")
    .map(role => role.trim())
    .filter(Boolean);

  if (roles.length === 0) {
    return null;
  }

  const payload: SetTokenPayload = {
    username,
    accessToken,
    roles,
    uid: String(params.uid || "").trim() || undefined,
    avatar: String(params.avatar || "").trim() || undefined,
    nickname: String(params.nickname || "").trim() || undefined,
    permissions: params.permissions
      ? String(params.permissions)
          .split(",")
          .map(permission => permission.trim())
          .filter(Boolean)
      : undefined
  };

  return payload;
}

(function () {
  const payload = parseSsoPayload();
  if (!payload) return;

  removeToken();
  setToken(payload);

  const params = getQueryMap(location.href) as Record<
    string,
    string | undefined
  >;
  const {
    roles: _roles,
    accessToken: _accessToken,
    permissions: _permissions,
    ...rest
  } = params;

  const newUrl = `${location.origin}${location.pathname}${subBefore(
    location.hash,
    "?"
  )}?${JSON.stringify(rest)
    .replace(/["{}]/g, "")
    .replace(/:/g, "=")
    .replace(/,/g, "&")}`;

  window.location.replace(newUrl);
})();
