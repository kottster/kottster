FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache git tini && \
    git clone https://github.com/kottster/kottster-template-js.git . && \
    rm -rf .git

RUN npm install

EXPOSE 5480 5481

ENV PORT=5480

COPY scripts/dev.sh /dev.sh
COPY scripts/prod.sh /prod.sh
COPY scripts/build.sh /build.sh
RUN chmod +x /dev.sh /prod.sh /build.sh

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["tail", "-f", "/dev/null"]