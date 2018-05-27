FROM ubuntu
RUN apt-get update
RUN apt-get install -qy apt-transport-https
RUN apt-get install -qy git
RUN apt-get install -qy locales
RUN apt-get install -qy nano
RUN apt-get install -qy tmux
RUN apt-get install -qy wget
RUN apt-get install -qy npm
RUN apt-get install -qy vim
RUN apt-get install -qy net-tools
RUN npm i n -g
RUN n latest
RUN apt-get -qy autoremove
ADD src /ptss
WORKDIR ptss
RUN rm -rf data/key.json
RUN rm -rf data/local.json
RUN rm -rf data/text.json
RUN touch data/key.json
RUN touch data/local.json
RUN npm i
EXPOSE 2525
# CMD node main.js