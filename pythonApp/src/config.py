from app import app
from flaskext.mysql import MySQL
mysql = MySQL()

app.config['MYSQL_DATABASE_HOST']= 'xxxxx.rds.amazonaws.com'
app.config['MYSQL_DATABASE_USER']= 'xxxxx'
app.config['MYSQL_DATABASE_PASSWORD']= 'xxxxx'
app.config['MYSQL_DATABASE_DB']= 'employee'

mysql.init_app(app)
