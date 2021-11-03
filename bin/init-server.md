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
```

Finally, create `/etc/wego/env` on the server side. It needs the same values as `.env.template`, as well as a `PORT`.

Also, make sure the Node version and path in `wego.service` matches the version installed (run `realpath $(which node)`).