FROM node:24-alpine AS build-stage

WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@10 --activate

COPY .npmrc package.json pnpm-lock.yaml ./
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
