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
RUN cd /ptss && npm i
EXPOSE 1414
EXPOSE 2525
EXPOSE 3636