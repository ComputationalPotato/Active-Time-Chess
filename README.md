# Linux (Ubuntu) deployment instructions

- Install Apache Web Server
  - Open terminal (Ctrl + Shift + T)
  - Run ```sudo apt update``` in terminal
  - Run ```sudo apt install apache2``` in terminal, entering ```y``` when it asks if you would like to continue
  - Once installed, you should be able to test that it is installed successfully by typing ```localhost``` into your browser

- Configure Apache Web Server
  - Head to ```/etc/apache2/sites-enabled/```
    - Open ```000-default.conf```
    - Change the line starting with ```DocumentRoot``` to ```DocumentRoot /var/www/html/public```
  - Restart the web server to push changes by entering the following commands in console
    - ```sudo systemctl restart apache2```
    - ```sudo systemctl stop apache2```
    - ```sudo systemctl start apache2```

- Clone repository
  - Before starting, delete ```index.html``` from ```/var/www/html```
  - If you encounter access denied errors, you may need to run ```sudo chown -R $USER:$USER /var/www``` to change the owner to user (DO NOT DO THIS ON A LIVE SERVER, ONLY FOR TESTING)
    - Alternatively, log into root using ```sudo -s``` and then entering your password

  - Using the terminal in Git
    - Open the terminal
    - Clone the repository to ```/var/www/html/``` by moving to that location in terminal and entering
      - ```git clone git@github.com:ComputationalPotato/Active-Time-Chess.git .```
      - Enter ```yes``` when it asks if you would like to continue connecting.
    - Ensure that in ```/var/www/html``` we have server.ts, gamelogic.ts, etc with the public folder

  - Alternative if the above does not work
    - Head to <https://github.com/ComputationalPotato/Active-Time-Chess>
    - Click the green ```<> Code``` button
    - Extract the ZIP to ```/var/www/html```

- Install Node.js, node package manager, and pm2
  - Run ```sudo apt install nodejs``` in terminal, entering ```y``` when it asks
  - Run ```sudo apt install npm``` in terminal, entering ```y``` when it asks
  - Run ```npm install pm2@latest -g```
  - Run ```npm install typescript```

- Convert TS files to JS
  - in ```/var/www/html``` run ```npx tsc  --noCheck --target es2017```

- Install PostgreSQL
  - Open terminal
  - Run ```sudo apt install postgresql```

- Configure PostgreSQL
  - Run ```sudo -u postgres psql```
  - Run ```\c atchess```
  - Run ```\i /var/www/html/dump.sql```
  - Run ```\q``` to quit
