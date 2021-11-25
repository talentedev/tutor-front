# Online Tutoring Service Front-End

To build this front-end in Angular (development server only):

```sh
$ cd /var/www/frontend
$ systemctl stop nginx
$ git checkout dev
$ git pull
$ rm -rf dist
$ ng build --aot --configuration=stage
$ systemctl start nginx
```

References:
[Flex-Layout](https://github.com/angular/flex-layout/wiki/Declarative-API-Overview)
