FROM node:10
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 6051
CMD [ "npm", "install" ]
CMD [ "npm", "start" ]