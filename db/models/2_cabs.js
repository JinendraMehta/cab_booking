module.exports = (dbConnection) => {
  return class Cabs {
    constructor(status, driver_id, number_of_seats, number_plate, longitude, latitude,id) {
      this.status = status;
      this.driver_id = driver_id;
      this.number_of_seats = number_of_seats;
      this.number_plate = number_plate;
      this.longitude = longitude;
      this.latitude = latitude;
      if(id) this.id = id;
    }

    static tableName = 'cabs';

    static getCount() {
      return dbConnection.query(`select count(*) from ${Cabs.tableName}`).then(([rows]) => {
        return rows[0]['count(*)'];
      })
    }

    static findByAvailabilityOrSeatsOrID(ignoreBooked,numberOfSeats,cabID){
      let findFilter = '';

      if(ignoreBooked && numberOfSeats && cabID){
        findFilter = `where status <> "BOOKED" and number_of_seats >= ${numberOfSeats} and id=${cabID}`
      } else if (ignoreBooked && numberOfSeats) {
        findFilter = `where status <> "BOOKED" and number_of_seats >= ${numberOfSeats}`;
      } else if (ignoreBooked) {
        findFilter = `where status <> "BOOKED"`;
      } else if (numberOfSeats) {
        findFilter = `where number_of_seats >= ${numberOfSeats}`;
      }

      return dbConnection.query(`select * from ${Cabs.tableName} ${findFilter}`).then(([rawCabs]) => {
        let cabs = [];

        rawCabs.forEach(rawCab =>{
          cabs.push(new Cabs(rawCab.status,
            rawCab.driver_id,
            rawCab.number_of_seats,
            rawCab.number_plate,
            rawCab.longitude,
            rawCab.latitude,
            rawCab.id
          ));
        });

        return cabs;
      });
    }

    save(fields) {
      if (this.id && fields.length) {
        let updateStatement = `update ${Cabs.tableName} set`;
        fields.forEach(field => {
          updateStatement += ' ' + field + '="' + this[field] + '", ';
        });

        updateStatement = updateStatement.substring(0, updateStatement.length - 2);

        updateStatement += ' where id=' + this.id;

        return dbConnection.query(updateStatement);
      } else {
        return Promise.reject({message: 'Cab ID not set or no fields provided to save'});
      }
    }

    saveNew(){
      return dbConnection.execute(`insert into ${Cabs.tableName} (status, driver_id, number_of_seats, number_plate, longitude, latitude) values (?,?,?,?,?,?)`,
        [this.status, this.driver_id, this.number_of_seats, this.number_plate, this.longitude, this.latitude]);
    }
  }
};
