cd /var/learnt.io
DEPLOY_DIR=www-${3}
mkdir $DEPLOY_DIR
cd $DEPLOY_DIR
aws s3 sync s3://${1}/${2}/${3}/ .
cd ..
chown -R www-data:www-data $DEPLOY_DIR
rm -f www; ln -s $DEPLOY_DIR www
systemctl restart nginx
