FROM node:0.12

RUN mkdir /opt/nitro_client
COPY . /opt/nitro_client
WORKDIR /opt/nitro_client

# delete node_modules if they got copied
RUN rm -rf node_modules
RUN npm install


EXPOSE 3000
CMD ["npm", "run", "integration:bamboo:mssql"]
