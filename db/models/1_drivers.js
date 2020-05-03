module.exports = (dbConnection) => {
  return class Drivers {
    constructor(name, phone) {
      this.name = name;
      this.phone = phone;
    }

    static tableName = 'drivers';

    save() {
      dbConnection.execute(`insert into ${Drivers.tableName} (name,phone) values (?,?)`,
        [this.name, this.phone]);
    }

    static getCount() {
      return dbConnection.query(`select count(*) from ${Drivers.tableName}`).then(([rows]) => {
        return rows[0]['count(*)'];
      })
    }
  }
};
