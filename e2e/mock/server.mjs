import http from "node:http";
import { randomUUID } from "node:crypto";
import { URL } from "node:url";

const PORT = Number.parseInt(process.env.E2E_API_PORT || "19000", 10);

const nowIso = () => new Date().toISOString();

const sendJson = (res, statusCode, body) => {
  const text = JSON.stringify(body);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text)
  });
  res.end(text);
};

const readJsonBody = async req => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return null;
  return JSON.parse(raw);
};

const ok = data => ({ code: 200, msg: "ok", data });

const notFound = (res, method, pathname) => {
  sendJson(
    res,
    404,
    {
      code: 404,
      msg: `Not Found: ${method} ${pathname}`,
      data: null
    }
  );
};

const notImplemented = (res, method, pathname) => {
  console.error(`[mock-api] 501 ${method} ${pathname}`);
  sendJson(
    res,
    501,
    {
      code: 501,
      msg: `Not Implemented: ${method} ${pathname}`,
      data: null
    }
  );
};

// 1x1 transparent PNG
const CAPTCHA_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7WjYcAAAAASUVORK5CYII=",
  "base64"
);

let nextCustomerId = 1;
let nextTireId = 1;

const customers = [];
const tires = [];
const units = [
  {
    id: 1,
    uid: "unit-1",
    name: "个",
    symbol: "pc",
    companyId: "company-1"
  },
  {
    id: 2,
    uid: "unit-2",
    name: "条",
    symbol: "t",
    companyId: "company-1"
  }
];

const listWithPagination = (items, page, pageSize) => {
  const size = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10;
  const p = Number.isFinite(page) && page > 0 ? page : 1;
  const start = (p - 1) * size;
  const end = start + size;
  const sliced = items.slice(start, end);
  return {
    list: sliced,
    count: items.length,
    total: items.length,
    page: p,
    pageSize: size
  };
};

const matchPath = (pathname, pattern) => {
  const a = pathname.split("/").filter(Boolean);
  const b = pattern.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    const part = b[i];
    if (part.startsWith(":")) {
      params[part.slice(1)] = a[i];
    } else if (part !== a[i]) {
      return null;
    }
  }
  return params;
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
    const { pathname } = url;
    const method = (req.method || "GET").toUpperCase();

    // Health check
    if (method === "GET" && pathname === "/api/__health") {
      return sendJson(res, 200, ok({ status: "ok", time: nowIso() }));
    }

    // Auth
    if (method === "POST" && pathname === "/api/auth/login") {
      const body = await readJsonBody(req);
      const username =
        (body && typeof body.username === "string" && body.username) || "admin";
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      return sendJson(
        res,
        200,
        ok({
          avatar: "",
          username,
          nickname: "E2E",
          roles: ["admin"],
          permissions: [],
          accessToken: "e2e-access-token",
          refreshToken: "e2e-refresh-token",
          expires
        })
      );
    }

    if (method === "GET" && pathname === "/api/auth/current-company") {
      return sendJson(
        res,
        200,
        ok([
          {
            uid: "company-1",
            name: "E2E Company"
          }
        ])
      );
    }

    if (method === "GET" && pathname === "/api/auth/async-routes") {
      return sendJson(
        res,
        200,
        ok([
          {
            path: "/data/customer",
            name: "E2EDataCustomer",
            meta: { title: "客户管理", roles: ["admin"] }
          },
          {
            path: "/data/product",
            name: "E2EDataProduct",
            meta: { title: "商品管理", roles: ["admin"] }
          }
        ])
      );
    }

    // Captcha
    if (method === "GET" && pathname === "/api/verify/captcha") {
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": CAPTCHA_PNG.length,
        "Cache-Control": "no-store"
      });
      return res.end(CAPTCHA_PNG);
    }

    // Units
    if (method === "GET" && pathname === "/api/unit/all") {
      return sendJson(res, 200, { code: 200, data: units });
    }

    // Customer list
    {
      const params = matchPath(pathname, "/api/customer/page/:index");
      if (method === "GET" && params) {
        const index = Number.parseInt(params.index || "1", 10);
        const pageSize = Number.parseInt(url.searchParams.get("pageSize") || "", 10);
        const scope = url.searchParams.get("scope") || "nonDeleted";
        const name = url.searchParams.get("name") || "";
        const keyword = url.searchParams.get("keyword") || "";

        let list = customers.slice();
        if (scope === "deleted") list = list.filter(x => !!x.deleteAt);
        else if (scope === "all") list = list;
        else list = list.filter(x => !x.deleteAt);

        if (name) list = list.filter(x => (x.name || "").includes(name));
        if (keyword) {
          list = list.filter(x => {
            const hay = `${x.name || ""} ${x.code || ""} ${x.phone || ""} ${x.contact || ""}`;
            return hay.includes(keyword);
          });
        }

        return sendJson(res, 200, ok(listWithPagination(list, index, pageSize)));
      }
    }

    // Customer CRUD
    {
      const createMatch = matchPath(pathname, "/api/customer");
      if (method === "POST" && (pathname === "/api/customer/" || createMatch)) {
        const body = (await readJsonBody(req)) || {};
        const input = body.customer && typeof body.customer === "object" ? body.customer : body;
        const name = typeof input.name === "string" ? input.name.trim() : "";
        if (!name) {
          return sendJson(res, 400, { code: 400, msg: "name is required", data: null });
        }
        const record = {
          id: nextCustomerId++,
          uid: randomUUID(),
          code: typeof input.code === "string" ? input.code : `C${Date.now()}`,
          name,
          contact: typeof input.contact === "string" ? input.contact : "",
          phone: typeof input.phone === "string" ? input.phone : "",
          address: typeof input.address === "string" ? input.address : "",
          desc: typeof input.desc === "string" ? input.desc : "",
          creditLimit: typeof input.creditLimit === "number" ? input.creditLimit : undefined,
          deleteAt: null
        };
        customers.unshift(record);
        return sendJson(res, 200, ok(record));
      }

      const getMatch = matchPath(pathname, "/api/customer/:uid");
      if (getMatch && method === "GET") {
        const found = customers.find(x => x.uid === getMatch.uid);
        if (!found) return notFound(res, method, pathname);
        return sendJson(res, 200, ok(found));
      }

      const patchMatch = matchPath(pathname, "/api/customer/:uid");
      if (patchMatch && method === "PATCH") {
        const found = customers.find(x => x.uid === patchMatch.uid);
        if (!found) return notFound(res, method, pathname);
        const body = (await readJsonBody(req)) || {};
        const input = body.customer && typeof body.customer === "object" ? body.customer : body;
        if (typeof input.name === "string") found.name = input.name;
        if (typeof input.code === "string") found.code = input.code;
        if (typeof input.contact === "string") found.contact = input.contact;
        if (typeof input.phone === "string") found.phone = input.phone;
        if (typeof input.address === "string") found.address = input.address;
        if (typeof input.desc === "string") found.desc = input.desc;
        if (typeof input.creditLimit === "number") found.creditLimit = input.creditLimit;
        return sendJson(res, 200, ok(found));
      }

      const delMatch = matchPath(pathname, "/api/customer/:uid");
      if (delMatch && method === "DELETE") {
        const found = customers.find(x => x.uid === delMatch.uid);
        if (!found) return notFound(res, method, pathname);
        found.deleteAt = nowIso();
        return sendJson(res, 200, ok(true));
      }

      const restoreMatch = matchPath(pathname, "/api/customer/restore/:uid");
      if (restoreMatch && method === "POST") {
        const found = customers.find(x => x.uid === restoreMatch.uid);
        if (!found) return notFound(res, method, pathname);
        found.deleteAt = null;
        return sendJson(res, 200, ok(found));
      }
    }

    // Tire list
    {
      const params = matchPath(pathname, "/api/tire/page/:index");
      if (method === "GET" && params) {
        const index = Number.parseInt(params.index || "1", 10);
        const pageSize = Number.parseInt(url.searchParams.get("pageSize") || "", 10);
        const keyword = url.searchParams.get("keyword") || "";
        const group = url.searchParams.get("group") || "";

        let list = tires.slice();
        if (keyword) list = list.filter(x => (x.name || "").includes(keyword));
        if (group) list = list.filter(x => (x.group || "") === group);

        return sendJson(res, 200, ok(listWithPagination(list, index, pageSize)));
      }
    }

    // Tire CRUD
    {
      const createMatch = matchPath(pathname, "/api/tire");
      if (method === "POST" && (pathname === "/api/tire/" || createMatch)) {
        const body = (await readJsonBody(req)) || {};
        const name = typeof body.name === "string" ? body.name.trim() : "";
        if (!name) return sendJson(res, 400, { code: 400, msg: "name is required", data: null });
        const record = {
          id: nextTireId++,
          uid: randomUUID(),
          name,
          group: typeof body.group === "string" ? body.group : "默认",
          brand: typeof body.brand === "string" ? body.brand : "",
          pattern: typeof body.pattern === "string" ? body.pattern : "",
          format: typeof body.format === "string" ? body.format : "",
          unit: typeof body.unit === "string" ? body.unit : "个",
          purchasePrice: typeof body.purchasePrice === "number" ? body.purchasePrice : undefined,
          salePrice: typeof body.salePrice === "number" ? body.salePrice : 1,
          desc: typeof body.desc === "string" ? body.desc : ""
        };
        tires.unshift(record);
        return sendJson(res, 200, ok(record));
      }

      const getMatch = matchPath(pathname, "/api/tire/:uid");
      if (getMatch && method === "GET") {
        const found = tires.find(x => x.uid === getMatch.uid);
        if (!found) return notFound(res, method, pathname);
        return sendJson(res, 200, ok(found));
      }

      const patchMatch = matchPath(pathname, "/api/tire/:uid");
      if (patchMatch && method === "PATCH") {
        const found = tires.find(x => x.uid === patchMatch.uid);
        if (!found) return notFound(res, method, pathname);
        const body = (await readJsonBody(req)) || {};
        if (typeof body.name === "string") found.name = body.name;
        if (typeof body.group === "string") found.group = body.group;
        if (typeof body.brand === "string") found.brand = body.brand;
        if (typeof body.pattern === "string") found.pattern = body.pattern;
        if (typeof body.format === "string") found.format = body.format;
        if (typeof body.unit === "string") found.unit = body.unit;
        if (typeof body.purchasePrice === "number") found.purchasePrice = body.purchasePrice;
        if (typeof body.salePrice === "number") found.salePrice = body.salePrice;
        if (typeof body.desc === "string") found.desc = body.desc;
        return sendJson(res, 200, ok(found));
      }

      const delMatch = matchPath(pathname, "/api/tire/:uid");
      if (delMatch && method === "DELETE") {
        const idx = tires.findIndex(x => x.uid === delMatch.uid);
        if (idx === -1) return notFound(res, method, pathname);
        tires.splice(idx, 1);
        return sendJson(res, 200, ok(true));
      }
    }

    if (pathname.startsWith("/api/")) return notImplemented(res, method, pathname);
    return notFound(res, method, pathname);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[mock-api] error:", error);
    sendJson(res, 500, { code: 500, msg: "mock server error", data: null });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[mock-api] listening on http://127.0.0.1:${PORT}`);
});
