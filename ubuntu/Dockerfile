FROM ubuntu

# Install.
RUN \
  sed -i 's/# \(.*multiverse$\)/\1/g' /etc/apt/sources.list && \
  apt-get update && \
  apt-get -y upgrade && \
  rm -rf /var/lib/apt/lists/*

# Set environment variables.
ENV HOME /root
ENV LANG en_US.utf8

# Define working directory.
WORKDIR /root

# Define default command.
CMD ["bash"]