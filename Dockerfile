FROM node:lts-stretch-slim

RUN apt-get update
RUN apt-get install -y mysql-server
EXPOSE 8080
COPY . /opt/
WORKDIR /opt/
RUN npm install
ENTRYPOINT ["npm","run"]
CMD ["start"]