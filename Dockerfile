FROM node:12
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 6051
CMD [ "npm", "install" ]
CMD [ "npm", "start" ]