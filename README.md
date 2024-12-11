# RPI Server with postgreSQL and apache2 already installed (Ubuntu)
### Note: Everything is done while ssh’d on the server unless noted otherwise

## Ensure you are able to log into the server
- You need to be on the RPI wifi, or connected through RPI's VPN to be able to SSH into the server
- In terminal, type 'ssh <rcsid>@<server-name>.cs.rpi.edu'
  - Ex. ```ssh rpistudent@rtchess.cs.rpi.edu```
- Enter your password when it asks
- Ensure you have sudo access
  - Type a command using sudo
    - Ex. ```sudo ls```
  - Enter your password again
  - Make sure it successfully runs the command you send

## Configure apache2
- Change directory to '/etc/apache2/sites-enabled/'
- Open '000-default.conf' with sudo
  - ```sudo nano 000-default.conf```
- Change the line starting with 'DocumentRoot' to 'DocumentRoot /var/www/html/public'
- Add the line ```ProxyPass / http://localhost:3000/ retry=5``` anywhere in the file between the <VirtualHost> tags.
- Save and exit
  - Hit Ctrl+X
  - Enter ‘y’ in the prompt and hit enter
- Restart the web server to push changes by entering the following commands in console
  - ```sudo systemctl restart apache2```
  - ```sudo systemctl stop apache2```
  - ```sudo systemctl start apache2```
 
## Clone repository
- Before starting, delete 'index.html' from '/var/www/html'
  - ```cd /var/www/html```
  - ```rm index.html```
-If you encounter access denied errors, you may need to run ```sudo chown -R $USER:$USER /var/www``` to change the owner to user

### Using terminal
- Clone the repository to '/var/www/html/' by moving to that location in terminal and entering
  - ```git clone git@github.com:ComputationalPotato/Active-Time-Chess.git .```
  - Enter ```yes``` when it asks if you would like to continue connecting.
- Ensure that in '/var/www/html' we have server.ts, gamelogic.ts, etc, with the folder named 'public'

### Alternative if the above does not work (Do this on your local machine, not on the server)
- Head to https://github.com/ComputationalPotato/Active-Time-Chess
- Click the green '<> Code' button
- Extract the downloaded zip file to /var/www/html
- Open the terminal in the folder that contains the folder holding the extracted zip file
- Copy the files to the server
  - Type ‘scp -r <name-of-folder> <rcsid>@<server-name>:/var/www/html’
    - Ex. ‘scp -r chess rpistudent@rtchess.cs.rpi.edu:/var/www/html’
  - Enter your password when instructed

## Install node.js, node package manager, and pm2
- Run ```sudo apt install nodejs``` in terminal, entering ```y``` when it asks
- Run ```sudo apt install npm``` in terminal, entering ```y``` when it asks
- Run ```npm install pm2@latest -g```
- Run ```npm install typescript```

## Convert TS files to JS
- In ```/var/www/html``` run ```npx tsc  --noCheck --target es2017```

## Configure postgreSQL
- Run ```sudo -u postgres psql```
- Run ```\c atchess```
- Run ```\i /var/www/html/dump.sql```
- Run ```\q``` to quit

## Reset server
- In ‘/var/www/html’
  - Run ```pm2 stop server.js```
    - This may not be needed, but better to be safe than sorry
  - Run ```sudo systemctl reload apache2```
  - Run ```sudo systemctl stop apache2```
  - Run ```sudo systemctl start apache2```
  - Run ```pm2 start server.js```
  - The server should be ready. If you try to load the server too fast after a restart, it could result in errors, so give 30s to a minute before seeing if it works. If not, you may need to repeat these steps.
You should now be able to visit the server on your browser at ‘http://<server_name>.cs.rpi.edu’ ( Ex. http://rtchess.cs.rpi.edu )
