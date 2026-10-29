FROM node:26.13.0-alpine AS build-stage

WORKDIR /app
# Node 26 不再随发行版分发 Corepack，改用 npm 安装；版本与 package.json 的
# packageManager(pnpm@12.10.1) 对齐（原 12.5.1 是历史遗留，会与 packageManager 漂移）。
RUN npm install -g pnpm@12.10.1 && pnpm --version

COPY .npmrc package.json pnpm-lock.yaml ./
COPY scripts ./scripts
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:alpine AS production-stage

ARG CSP_MODE=report-only

COPY nginx.conf /etc/nginx/conf.d/default.report-only.conf
COPY nginx.csp-enforce.conf /etc/nginx/conf.d/default.enforce.conf

RUN if [ "$CSP_MODE" = "enforce" ]; then \
      cp /etc/nginx/conf.d/default.enforce.conf /etc/nginx/conf.d/default.conf; \
    else \
      cp /etc/nginx/conf.d/default.report-only.conf /etc/nginx/conf.d/default.conf; \
    fi

COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
