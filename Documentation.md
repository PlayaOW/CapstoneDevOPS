# 01/28
# Generating an SSH key pair to access and log into the server.
```bash
ssh-keygen -t ed25519 -C "capstone-lab"
```
- ssh-keygen command generates a ssh key pair for your server
- -t tells ssh what encryption method to use.
- -C tells the name of the key pair
```bash
ssh-copy-id username@server_ip_address
```
- This tells the machine to send the new public ID to the server so it knows to trust you.
# Phase 2: Install Ansible to write Ansible Playbooks.
- Ansible is an automation product that automates executing commands to host or client machines.
- Ansible uses simple, human-readable scripts called playbooks to automate your tasks. You declare the desired state of a local or remote system in your playbook. Ansible ensures the system remains in that state.
- [More Information](https://docs.ansible.com/projects/ansible/latest/getting_started/introduction.html)
## Ansible Automation.
- https://docs.ansible.com/projects/ansible/latest/getting_started/get_started_inventory.html
- In this session we will be working with ansible to push configuration (such as installing tools, dependencies) to the managed nodes using the control node (The client or remote). 
- Now instead of sshing into the web server and executing commands manually we will pushthe ansible playbook into the web server to be able to configure it from the remote node.
- To get started with Ansible, first of all we need to create an inventory.ini file which includes information about our managed node.
```bash
nvim inventory.ini
```
- Ansible has three primary environments. Control node is the remote control node that has ansible installed and you would typically use commands like ```shell ansible``` or ```shell ansible-inventory``` in order to control managed nodes. Inventory, is a list of managed nodes and includes information about the managed nodes such as their IP address and ansible_user name. Note: Considering You have set up static IP for your managed servers. Managed nodes are remote systems that ansible controls and configures.
```yaml
[webservers]
192.168.x.x ansible_user=username ansible_ssh_private_key_file=~/.ssh/PrivateKeyFile
# first the IP of the web server we are trying to control using the remote node.
# UserName of the web server we are trying to configure.
```
- **NOTE** It is much better to let ansible ssh into the managed node using a key pair than writing the password within the inventory.ini file.
- Ansible is agentless, which means you do not need to install the client software on the host as well. You can do all operations on the host using the remote node without ever installing ansible on the host machine.
- After creating the inventory.ini file, we ran ansible -i inventory.ini all -m ping
```bash
[WARNING]: Host '192.168.1.250' is using the discovered Python interpreter at '/usr/bin/python3.12', but future installation of another Python interpreter could cause a different interpreter to be discovered. See https://docs.ansible.com/ansible-core/2.20/reference_appendices/interpreter_discovery.html for more information.
192.168.1.250 | SUCCESS => {
"ansible_facts": {
"discovered_interpreter_python": "/usr/bin/python3.12"
},
"changed": false,
"ping": "pong"
}
```
- Inside of the web app file, we would need to install and initiate some dependencies before we set up our DB docker container.
- https://docs.npmjs.com/about-npm-versions
```shell
npm init -y
npm install express mysql2 bcryptjs jsonwebtoken cors dotenv
```
- Currently struggling with deploying the web app on local network!!
- OKay in order to deploy the web app on local network this is what I had to do. Update client/vite.config.js had to be changed.
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
plugins: [react()],
server: {
proxy: {
'/api': {
target: 'http://localhost:5000',
changeOrigin: true,
},
'/music': {
target: 'http://localhost:5000',
changeOrigin: true,
}
}
}
})
```
- Before the vite config looked like this:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
```
- In this config, when the local machine tries to access the web app, because of localhost, it looks for the backend inside of local files.
- After changing the vite config reverse proxy, vite now works as a middleman. The browser sends request to api, vite looks at the request and looks at its config and redirects the request to the ubuntu server where the backend lives.
- In order to let the local network access the web server and web app, I also had to change the dev script inside of client/package.json and set the --host flag on.
```json
{
"name": "client",
"private": true,
"version": "0.0.0",
"type": "module",
"scripts": {
"dev": "npx vite --host",
"build": "vite build",
"lint": "eslint .",
"preview": "vite preview"
},
"dependencies": {
"@tailwindcss/postcss": "^4.1.18",
"axios": "^1.13.4",
"clsx": "^2.1.1",
"framer-motion": "^12.31.0",
"lucide-react": "^0.563.0",
"react": "^19.2.0",
"react-dom": "^19.2.0",
"react-router-dom": "^7.13.0",
"tailwind-merge": "^3.4.0",
"vite": "^7.3.1"
},
"devDependencies": {
"@eslint/js": "^9.39.1",
"@types/react": "^19.2.5",
"@types/react-dom": "^19.2.3",
"@vitejs/plugin-react": "^5.1.1",
"autoprefixer": "^10.4.24",
"eslint": "^9.39.1",
"eslint-plugin-react-hooks": "^7.0.1",
"eslint-plugin-react-refresh": "^0.4.24",
"globals": "^16.5.0",
"postcss": "^8.5.6",
"tailwindcss": "^4.1.18"
}
}
```
- Also setting ```json changeOrigin:true```, disables Browsers built in CORS feature. This tells vite to modify the origin to its original target, so when other machine tries to access the backend the backend server thinks the request is coming from its own machine.
- Now everytime ``shell npm run dev``` is executed this runs the script that prepares back and frontend to serve the web app:
```txt
npm run dev

> pomodorogame@1.0.0 dev
> npx concurrently "npm run start:server" "npm run start:client"

 > pomodorogame@1.0.0 start:server
 > cd server && npm run dev
 > pomodorogame@1.0.0 start:client
 > cd client && npm run dev
 > server@1.0.0 dev
 > nodemon index.js
 > client@0.0.0 dev
 > npx vite --host
```
- 
# TODO
- [] Write Ansible Playbook to conf db server, and web server and create docker containers.
```yml
---
- hosts: dbservers
tasks:
- name: Create a dir named databases
ansible.builtin.file:
path: ~/Documents/database
state: directory
tags: crdir

- name: Copying Schema.SQL to managed node
ansible.builtin.copy:
src: /home/playaow/Documents/ET4999/pomodoroGame/server/schema.sql
dest: ~/Documents/database/schema.sql
tags: cpsql

- name: Making sure python3-docker is installed
ansible.builtin.apt:
name: python3-docker
state: present
become: yes  # apt usually requires sudo
tags: py3docker

- name: Run MySQL Docker container
community.docker.docker_container:
name: mysql-db
image: mysql:latest
state: started
recreate: yes
restart_policy: always
published_ports:
- "3306:3306"
env:
MYSQL_ROOT_PASSWORD: "PASSREDACTED" # Matches your server/.env
MYSQL_DATABASE: "pomodoro_db"
volumes:
- "~/Documents/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql"
tags: dkr
```
- ```shell ansible-playbook -i inventory.imi playbook.yml```
- Then we would need to manually add the databse of web app into the docker container.
```shell
docker exec -i process_id mysql -u user -p'your_db_pass' pomodoro_db < ~/Documents/pathToYourSchema.sql
```
- Now enter the container using: ```shell docker exec -it -u user -p```
- Upon prompt enter your password. and inside the container execute:
```sql
USE database_name;
SHOW TABLES;
```
- If tables are showing then the database has been succesfully imported into the MySQL database.
- Now onto the second task. Keeping the web app running on my ubuntu server even after ssh connection closes and terminal closes. (Session 02/06).
- ```txt
* https://www.youtube.com/watch?v=vFOvvUcBbNY
* https://medium.com/@bassettjosh397/how-to-deploy-a-local-server-to-the-internet-with-https-protocol-6f21ade6ad7d
* Buy a DNS name and set up its A record to point to your public IP.
* https://www.hostwinds.com/tutorials/nginx-reverse-proxy-with-ssl

```
- These two lines were added in my server/index.js file. These lines ensures whenever client tries to access the web app, these lines of code lets the client browser download html, css in the public dir of working dir.
```js
app.use(express.static(path.join(__dirname, 'public')));

app.get(/*./, (req, res) => {
res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

```
- if user request a URL the API does not recognize it sends the user to index.html of the React App.
```txt
https://expressjs.com/en/starter/static-files.html
https://vite.dev/guide/build.html
https://stackoverflow.com/questions/50283111/reload-the-page-gets-404-error-using-react-router
```
- Now I am going to create a Dockerfile that will start a lightweight node image and copy everything inside of that. That should solve the problem of having the web app up even when I close the SSH connection to the webserver.
- The Docker file I created to have the app running:
```dockerfile
FROM node:18-alpine AS client-build
# Using a lightweight node image to build the frontend

# Set the working dir for the image
WORKDIR /pomodoroGame/client

# Copy package files and install all dependencies such as npm
COPY client/package*.json ./
RUN npm install

#COPY the rest of the codes inside client
COPY client/ ./

# Start npm run build to create the start/stop script
RUN npm run build

# Create another node image for the backend server
FROM node:18-alpine

# Set the working dir
WORKDIR /pomodoroGame/server

# Copy package json files from the web server
COPY server/package*.json ./
RUN npm install

# Copy everyhting else inside of server dir
COPY server/ ./

# Now we will copy the built react file into the public dir so that server/index.js works
COPY --from=client-build /pomodoroGame/client/dist ./public

# Expose the port 5000 the server is running on for the images
EXPOSE 5000

#start the app
CMD ["node", "index.js"]

```
- Source:
```txt
https://docs.docker.com/build/building/multi-stage/
```
- Run ```shell docker build -t pomodoro-game . ``` to build necessary image using the default Dockerfile inside of root folder.
- REsult:
```txt
sudo docker build -t pomodoro-game .
[sudo] password for rayhomelab:
[+] Building 208.3s (16/16) FINISHED                                          docker:default
=> [internal] load build definition from Dockerfile                                    0.3s
=> => transferring dockerfile: 981B                                                    0.0s
=> [internal] load metadata for docker.io/library/node:18-alpine                       0.6s
=> [internal] load .dockerignore                                                       0.3s
=> => transferring context: 2B                                                         0.0s
=> [internal] load build context                                                      13.9s
=> => transferring context: 816.05MB                                                  13.0s
=> CACHED [client-build 1/6] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b  0.0s
=> [stage-1 2/6] WORKDIR /pomodoroGame/server                                          2.5s
=> [client-build 2/6] WORKDIR /pomodoroGame/client                                     2.7s
=> [stage-1 3/6] COPY server/package*.json ./                                          7.2s
=> [client-build 3/6] COPY client/package*.json ./                                     6.7s
=> [client-build 4/6] RUN npm install                                                144.7s
=> [stage-1 4/6] RUN npm install                                                     144.2s
=> [stage-1 5/6] COPY server/ ./                                                      20.6s
=> [client-build 5/6] COPY client/ ./                                                 28.0s
=> [client-build 6/6] RUN npm run build                                                7.7s
=> [stage-1 6/6] COPY --from=client-build /pomodoroGame/client/dist ./public           1.1s
=> exporting to image                                                                  3.1s
=> => exporting layers                                                                 2.8s
=> => writing image YOLLO  0.0s
=> => naming to docker.io/library/pomodoro-game
```
- Now we actually run the created images: ```shell docker run 5000:5000 -d pomodoro-gamev2.0```

## TODO Create CI/CD pipeline using github actions
- https://github.com/appleboy/ssh-action
- https://docs.docker.com/build/ci/github-actions/
- https://www.youtube.com/watch?v=x7f9x30W_dI
- Initialize and push the code to github.
```shell
git init
git add .
git commit -m "Comment"
git branch -M main
git push -u origin main
```
- In this case I did not have to conf git, since I already had it conf to my email and username.
- 



