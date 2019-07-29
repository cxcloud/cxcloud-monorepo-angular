FROM node:10

USER root

WORKDIR /data/cxcloud-service

COPY src/ /data/cxcloud-service/src
COPY config/ /data/cxcloud-service/config
COPY *.json /data/cxcloud-service/

RUN npm install --silent
RUN npm run build

EXPOSE 4003

CMD ["npm", "run", "start:production"]
