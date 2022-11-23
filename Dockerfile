FROm node:17

# Wokring Dor
WORKDIR /usr/

# Copy Package JSON files
COPY package*.json ./

RUN npm install rimraf

RUN npm install

# Copy Source Files
COPY . .

# Build
RUN npm run build

# Expose the API port
EXPOSE 1337

CMD [ "node", "dist/index.js" ]