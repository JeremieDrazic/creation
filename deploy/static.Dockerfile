FROM nginxinc/nginx-unprivileged:1.30.4-alpine@sha256:adf5042a17f4ecdd200c595fa9ffd1be37efb18f89a830bd1a00e4ab4d59d42c
ARG RELEASE_SHA
LABEL org.opencontainers.image.source="https://github.com/JeremieDrazic/creation" \
      org.opencontainers.image.revision="${RELEASE_SHA}"
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/web/dist /usr/share/nginx/html
COPY apps/docs/dist /usr/share/nginx/html/docs
COPY apps/storybook/storybook-static /usr/share/nginx/html/design-system
