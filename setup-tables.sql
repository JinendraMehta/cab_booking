# create table locations
# (
#     id         INT         NOT NULL PRIMARY KEY AUTO_INCREMENT,
#     latitude   VARCHAR(10) NOT NULL,
#     longitude  VARCHAR(10) NOT NULL,
#     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
#     updated_at DATETIME    NULL on UPDATE CURRENT_TIMESTAMP,
#     UNIQUE KEY latitude_longitude (latitude, longitude)
# );

create table drivers
(
    id         INT         NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(50) NOT NULL,
    phone      VARCHAR(20) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME    NULL on UPDATE CURRENT_TIMESTAMP
);

create table cabs
(
    id              INT                         NOT NULL PRIMARY KEY AUTO_INCREMENT,
    number_plate    VARCHAR(15)                 NOT NULL UNIQUE,
    number_of_seats INT                         NOT NULL,
    latitude        VARCHAR(10)                 NOT NULL,
    longitude       VARCHAR(10)                 NOT NULL,
    driver_id       INT                         NOT NULL UNIQUE,
    status          ENUM ('AVAILABLE','BOOKED') NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME                    NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT cabs_drivers_id_fk FOREIGN KEY (driver_id) REFERENCES drivers (id) ON UPDATE CASCADE
);

create table users
(
    id         INT          NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(50)  NOT NULL,
    phone      VARCHAR(20)  NOT NULL UNIQUE,
    email      VARCHAR(320) NOT NULL UNIQUE,
    password   VARCHAR(320) NOT NULL,
    latitude   VARCHAR(10)  NULL,
    longitude  VARCHAR(10)  NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP
);

create table auth_tokens
(
    id         INT          NOT NULL PRIMARY KEY AUTO_INCREMENT,
    token      VARCHAR(320) NOT NULL UNIQUE,
    user_id    INT          NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT auth_tokens_users_id_fk FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE CASCADE
);

create table bookings
(
    id                    INT                                        NOT NULL PRIMARY KEY AUTO_INCREMENT,
    pickup_latitude       VARCHAR(10)                                NOT NULL,
    pickup_longitude      VARCHAR(10)                                NOT NULL,
    destination_latitude  VARCHAR(10)                                NOT NULL,
    destination_longitude VARCHAR(10)                                NOT NULL,
    user_id               INT                                        NOT NULL,
    fare                  INT                                        NOT NULL,
    number_of_passengers  INT                                        NOT NULL,
    status                ENUM ('CONFIRMED', 'CANCELED')             NOT NULL,
    commute_status        ENUM ('NOT_STARTED', 'STARTED','FINISHED') NOT NULL,
    cab_id                INT                                        NOT NULL,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME                                   NULL ON UPDATE CURRENT_TIMESTAMP
);
