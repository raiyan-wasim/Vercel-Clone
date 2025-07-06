FROM ubuntu:focal

RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL http://deb.nodesource.com/setup_20.x | bash -
RUN apt-get upgrade -y
RUN apt-get install -y nodejs
RUN apt-get install git -y


WORKDIR /home/app

COPY main.sh main.sh
COPY script.js script.js
COPY package*.json .

# to install the packages "@aws-sdk/client-s3": "^3.835.0","mime-types": "^3.0.1"
RUN npm install 

# now, we need to give executable permission
RUN chmod +x main.sh
RUN chmod +x script.js


ENTRYPOINT [ "/home/app/main.sh" ]