# Amazon Chime SDK Background Blur/Backgournd Replacement/Noise Suppression Demos of Amazon Chike SDK for Javascript

## configuration

### (1) setup AWS Credential

It is assumed that AWS Credential is configured. If you have not yet done so, please refer to this page to configure it.

https://docs.aws.amazon.com/sdk-for-java/v1/developer-guide/setup-credentials.html

### (2) install node

If you have not installed node, install it.
see [nodejs's offical page](https://nodejs.org/en/)

If you use debian as a root, below may help.

```
$ ### install nodejs
$ apt install -y curl
$ curl -sL https://deb.nodesource.com/setup_lts.x | bash -
$ apt install -y nodejs

$ ### install n and upgrade node, npm.
$ npm install -g n
$ n latest
$ npm update -g npm
```

## run demo

### (1) install npm package

At first, you should install required npm packages.

```
$ npm install
```

### (2) run

Run the command below to start the demo. Access https://<server_ip>:9000 or https://localhost:9000 with a browser.

```
$ npm run start
```

### (3) use demo

Input meeting name and username, devices you use. Then, you join the meeting.
In the meeting you can change the strength of noise suppression or change the background blur/replacement type.
And if you want to change the image for background replacement, push the gear button and opne the dialog. In the dialog you can set the url for the image.

![image](https://user-images.githubusercontent.com/48346627/151463109-47856d5d-abd6-457a-8e45-1f561f68b66b.png)
