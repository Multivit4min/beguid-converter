module.exports = {
  //Webserver Listenport
  listenport: 6051,

  //Data directory for caching
  datadir: `${__dirname}/data`,

  //Cache
  cache: {
    //Time to keep Data in Cache
    keep_time: 14 * 24 * 60 * 60 * 1000,  //14 days
    //Cache Save to Disk Interval
    save_interval: 1 * 60 * 60 * 1000     //1 hour
  },

  //maximum allowed keys in post request
  post_key_limit:  250,

  //Database
  mysql: {
    //Connection Schema doc: https://github.com/mysqljs/mysql#connection-options
    conn: {
      host:       "localhost",  //mysql hostname
      port:       3306,         //mysql database port
      user:       "",           //mysql username
      password:   "",           //mysql password
      database:   "",           //mysql database name
      connectionLimit: 5        //mysql connection pool
    },
    //mysql table name
    table: "beguid"
  },

  generator: {
    //how much inserts should be done per batch
    batchsize: 50000n //(LEAVE the n at the end of the number!!!!)
  },

  //engine related stuff
  //do not touch if you do not know what you do :P
  guid: {
    //this defines how much chars of the guid will get saved
    //should be a multiple of 2
    //defines how much characters of the guid should be saved in the database
    //it is recommended to use either 6 or 8
    //length of 6: needs 17.6GB Disk Space per billion ids -> uses more CPU per request (but barely noticeable)
    //length of 8: needs 19.6GB Disk Space per billion ids -> requires less CPU per request
    length: 6,
  },

  steamid: {
    //the first valid existing steamid, should probably never be changed
    offset: 76561197960265730n, //(LEAVE the n at the end of the number!!!!)
  },

}
