FROM node:16-alpine

WORKDIR /home/node/airbyte

COPY ./ ./simplicate-source
RUN cd simplicate-source && yarn install && yarn build

RUN ln -s "/home/node/airbyte/simplicate-source/bin/main" "/home/node/airbyte/main"

ENV AIRBYTE_ENTRYPOINT "/home/node/airbyte/main"
ENTRYPOINT ["/home/node/airbyte/main"]
