FROM schlez/docker-node-gyp

LABEL maintainer="Aurélien Perillat-Bottonet <aurelien.perillat-bottonet@sogeti.com>"

WORKDIR /app

ADD package.json /app/package.json
RUN npm install --production

COPY . /app/

EXPOSE 8080

CMD ["npm", "run", "start"]
