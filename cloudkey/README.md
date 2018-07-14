# Unifi CloudKey Setup Instructions

## Requires
* a Unifi CloudKey OR a server running Unifi Controller with same general configuration as Unifi CloudKey
* a SSL cert installed on CloudKey - either: 
  * a self-signed cert per the main project README; or
  * a signed cert - https://gist.github.com/potto007/4782d817ed12234e81e5df2eda637cbd

## Assumptions
* Unifi-Parental installed at /usr/local/src/unifi-parental

## Installation
0. If you have a signed cert installed on CloudKey - create symlinks to `cloudkey.key` and `cloudkey.crt`:
  ```
  ln -s /etc/ssl/private/cloudkey.crt /usr/local/src/unifi-parental/
  ln -s /etc/ssl/private/cloudkey.key /usr/local/src/unifi-parental/
  ```
1. Edit `config.json`. Update `server` block, adding `host`.  The `server` block should look similar to:
```
  "server": {
    "key": "cloudkey.key",
    "cert": "cloudkey.crt",
    "host": "127.0.0.1",
    "port": 4000
  },
```
2. Generate password file for nginx:
    1. Install Apache Utilities
    ```
    apt-get update
    apt-get install apache2-utils
    ```
    2. Add user+password and create password file (-c argument creates password file)
    ```
    htpasswd -c /usr/local/src/unifi-parental/cloudkey/nginx/.htpasswd <USERNAME>
    <enter and re-enter password when prompted>
    ```
    3. Add additional user(s) (-c argument ommitted subsequent executions)
    ```
    htpasswd /usr/local/src/unifi-parental/cloudkey/nginx/.htpasswd <USERNAME>
    <enter and re-enter password when prompted>
    ```
3. Edit `/usr/local/src/unifi-parental/cloudkey/nginx/unifi-parental`:
    1. Update line 2 with the ip of your CloudKey
    2. Update line 8 with your server name OR the ip of your CloudKey if you don't have a name configured
    3. Update line 13, change to any address that should NOT be able to access the unifi-parental interface. Add additional DENY lines, if desired. Remove line 13 if not applicable.
4. Create symlinks for nginx
```
ln -s /usr/local/src/unifi-parental/cloudkey/nginx/unifi-parental /etc/nginx/sites-available/
ln -s /etc/nginx/sites-available/unifi-parental /etc/nginx/sites-enabled/
```
5. Install unifi-parental service
```
ln -s /usr/local/src/unifi-parental/cloudkey/unifi-parental.service /lib/systemd/system/
systemctl enable unifi-parental
```
6. Start unifi-parental service
```
systemctl start unifi-parental
```
7. Restart nginx
```
systemctl restart nginx
```