# OpenSearch Cluster using CDK

Creating proxy tunnel
```
ssh -fN -L 9200:xxxx.eu-west-1.es.amazonaws.com:443 -i "key.pem" ec2-user@3.250.235.66
```


### Nginx Proxy
Install Nginx in EC2
```
sudo yum update
sudo amazon-linux-extras install nginx1
```

If you use a test environment with a self-signed certificate, then to generate a private key, run the OpenSSL x509 command:
```
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/cert.key -out /etc/nginx/cert.crt
```
The configure nginx and add section
```
server {
       listen       443 ssl http2;
       listen       [::]:443 ssl http2;
       server_name  _;
       ssl_certificate           /etc/nginx/cert.crt;
       ssl_certificate_key       /etc/nginx/cert.key;
       ssl_session_cache shared:SSL:1m;
       ssl_session_timeout  10m;
       ssl_protocols  TLSv1 TLSv1.1 TLSv1.2;
       ssl_ciphers HIGH:!aNULL:!eNULL:!EXPORT:!CAMELLIA:!DES:!MD5:!PSK:!RC4;
       ssl_prefer_server_ciphers on;

location /_dashboards {

proxy_pass https://<your domain>/_dashboards;


}
       # Load configuration files for the default server block.
       include /etc/nginx/default.d/*.conf;

       error_page 404 /404.html;
           location = /40x.html {
       }

       error_page 500 502 503 504 /50x.html;
           location = /50x.html {
       }
   }


```

command to start 
```
sudo systemctl enable nginx && sudo systemctl start nginx
```
