create table locations
(
    id         INT      NOT NULL PRIMARY KEY AUTO_INCREMENT,
    latitude   DECIMAL  NOT NULL,
    longitude  DECIMAL  NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL on UPDATE CURRENT_TIMESTAMP
);
