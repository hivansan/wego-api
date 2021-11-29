## Step 1

```bash
mkdir -p ~/app
sudo mkdir -p /etc/wego
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
exit
```

## Step 2

```bash
. ~/.nvm/nvm.sh
nvm install node
node --version
sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000
```

## Step 3

Set up PaperTrail

```
wget -qO - --header="X-Papertrail-Token: [TOKEN GOES HERE]" https://papertrailapp.com/destinations/27159581/setup.sh | sudo bash
```

Finally, create `/etc/wego/env` on the server side. It needs the same values as `.env.template`, as well as a `NODE_PORT`,
and optionally `NODE_HOST` and maybe also `NODE_ENV`.

Also, make sure the Node version and path in `wego.service` matches the version installed (run `realpath $(which node)`).